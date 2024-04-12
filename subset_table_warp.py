#!/usr/bin/env python

import sys
import cv2
import cv2 as csv
import heapq
import numpy as np
import pandas as pd
import re

from utils import show, show_contour

THRESHOLD=115

def apply_threshold(img, bottom, top=255):
    img_bin = cv2.adaptiveThreshold(img,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY,5,2)    
    return img_bin

def simplify_contour(img, contour, eps_lower=0.1, eps_upper=10):
    desired_segments = 8  # For example, to approximate to a rectangle
    
    # Start with a broad range for epsilon and narrow down
    epsilon_lower_bound = eps_lower
    epsilon_upper_bound = eps_upper

    perimeter = cv2.arcLength(contour, True)
    
    for i in range(50):  # Limit to 50 iterations for safety
        epsilon = (epsilon_upper_bound + epsilon_lower_bound) / 2
        approx = cv2.approxPolyDP(contour, epsilon, True)
        # print(i, epsilon, len(approx))
        
        if len(approx) > desired_segments:
            epsilon_lower_bound = epsilon
        elif len(approx) < desired_segments:
            epsilon_upper_bound = epsilon
        else:
            break  # Found or close enough to the desired number of segments
    
    # Draw the approximated contour
    # show_contour(img, contour)
    # show_contour(img, approx)
    
    return approx

def distance(pt1, pt2):
    """Compute the Euclidean distance between two points."""
    return np.sqrt((pt1[0,0] - pt2[0,0])**2 + (pt1[0,1] - pt2[0,1])**2)

def filter_short_segments(contour, min_length):
    """Filter out segments of the contour that are shorter than min_length."""
    filtered_points = [contour[0]]  # Start with the first point
    for i in range(1, len(contour)):
        if distance(contour[i-1], contour[i]) >= min_length:
            filtered_points.append(contour[i])
    
    # Check the distance between the last and the first point (to close the contour if necessary)
    if distance(filtered_points[-1], contour[0]) < min_length:
        filtered_points.pop()  # Remove the last point if it doesn't close a long enough contour with the first point

    return np.array(filtered_points)

def order_points(pts):
    """Order the points in top-left, top-right, bottom-right, bottom-left order."""
    rect = np.zeros((4, 2), dtype="float32")

    # top-left point has the smallest sum
    # bottom-right point has the largest sum
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    # top-right point will have the smallest difference
    # bottom-left will have the largest difference
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]

    return rect

# Assuming you've found contours and computed the convex hull...

def warp_hull(img, hull):
    # Get a rectangular approximation of the convex hull (use approxPolyDP with desired_segments=4 as described before)
    # epsilon = 0.05 * cv2.arcLength(hull, True)
    # rect_approx = cv2.approxPolyDP(hull, epsilon, True)

    h = hull
    
    # Order the points of the rectangular approximation
    ordered_points = order_points(h)
    
    # Determine the dimensions of the new warped rectangle
    width1 = np.sqrt(((ordered_points[2][0] - ordered_points[3][0]) ** 2) + ((ordered_points[2][1] - ordered_points[3][1]) ** 2))
    width2 = np.sqrt(((ordered_points[1][0] - ordered_points[0][0]) ** 2) + ((ordered_points[1][1] - ordered_points[0][1]) ** 2))
    height1 = np.sqrt(((ordered_points[1][0] - ordered_points[2][0]) ** 2) + ((ordered_points[1][1] - ordered_points[2][1]) ** 2))
    height2 = np.sqrt(((ordered_points[0][0] - ordered_points[3][0]) ** 2) + ((ordered_points[0][1] - ordered_points[3][1]) ** 2))
    max_width = max(int(width1), int(width2))
    max_height = max(int(height1), int(height2))
    
    # Define the coordinates for the new rectangle
    dst_pts = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")
    
    # Compute the perspective transform matrix and warp the image to fit the new rectangle
    matrix = cv2.getPerspectiveTransform(ordered_points, dst_pts)
    warped = cv2.warpPerspective(img, matrix, (max_width, max_height))

    return warped

def filter_bounding_boxes(boxes, min_area=20, max_area=5000, min_aspect=0.2, max_aspect=5.0):
    filtered_boxes = []
    for box in boxes:
        x1, y1 = box[0]
        x2, y2 = box[1]
    
        width = abs(x2 - x1)
        height = abs(y2 - y1)

        if height == 0 or width == 0:
            continue
    
        aspect_ratio = float(width) / height
        area = width * height
    
        if min_aspect <= aspect_ratio <= max_aspect and min_area <= area <= max_area:
            filtered_boxes.append(box)

    return filtered_boxes
    
def remove_cavities(contour, r):
    """
    Remove cavities from a CV2 contour.
    
    Parameters:
    - contour: The input CV2 contour
    - r: Search radius to identify close points
    
    Returns:
    - A simplified CV2 contour
    """
    
    def euclidean_distance(pt1, pt2):
        """Helper function to compute Euclidean distance between two points."""
        return np.linalg.norm(np.array(pt1) - np.array(pt2))
    
    # Create a mask to mark points for deletion
    mask = np.ones(len(contour), dtype=bool)
    
    # Iterate over contour points
    for i in range(len(contour)):
        for j in range(i + 2, len(contour)):
            # Check distance in Euclidean space
            if euclidean_distance(contour[i][0], contour[j][0]) <= r:
                # Mark intervening points for deletion
                mask[i+1:j] = False
    
    # Construct simplified contour
    simplified_contour = contour[mask]
    
    return simplified_contour

def select_contours(img, contours):
    total_area = img.shape[0] * img.shape[1]
    min_area = 0.2 * total_area

    def has_right_area(c):
        c_area = cv2.contourArea(c)
        return c_area >= min_area # and c_area <= max_area

    right_area = [c for c in contours if has_right_area(c)]

    return right_area

def process_contour(img, c):
    approx = simplify_contour(img, c)
    outer_contour = remove_cavities(approx, 10)
    outer_contour_simp = simplify_contour(img, outer_contour, eps_lower=0.1, eps_upper=10)
    #hull = cv2.convexHull(table)

    return outer_contour_simp

def reshape_contour(contour):
    n_points = contour.shape[0] * contour.shape[1]
    return contour.reshape((n_points, 2)).tolist()

def find_contours(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    threshold = apply_threshold(gray, 80)

    contours, hier = cv2.findContours(threshold, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    contours = select_contours(img, contours)

    contours = [process_contour(img, c) for c in contours]
    contour_points = [reshape_contour(c) for c in contours]

    return contour_points

def subset_table_warp(img):
    contour_points = find_contours(img)

    target_contour = np.array(contour_points[0])

    table_img = warp_hull(img, target_contour)

    return contour_points, table_img


if __name__ == '__main__':
    infile, outfile = sys.argv[1:3]

    img = cv2.imread(infile, cv2.IMREAD_COLOR)

    contours, out_img = subset_table_warp(img)
    t_a = img.shape[0] * img.shape[1]

    show(out_img)

    import json
    for contour in contours:
        a = cv2.contourArea(np.array(contour))
        r = a / t_a
        print(f'{len(contour)}: {r}')

    cv2.imwrite(outfile, out_img)
