import cv2
import numpy as np
from utils import s

def preprocess_image(image):
    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply adaptive thresholding
    thresholded = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                        cv2.THRESH_BINARY_INV, 11, 2)
    return thresholded

def detect_lines(binary_image, kernel_size=30):
    # Detect vertical lines
    vertical_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, kernel_size))
    vertical_lines = cv2.morphologyEx(binary_image, cv2.MORPH_OPEN, vertical_kernel)

    # Detect horizontal lines
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, 2))
    horizontal_lines = cv2.morphologyEx(binary_image, cv2.MORPH_OPEN, horizontal_kernel)

    return vertical_lines, horizontal_lines

def find_corners(vertical_lines, horizontal_lines):
    # Combine the vertical and horizontal lines
    combined_lines = cv2.add(vertical_lines, horizontal_lines)

    # Find intersections (corners) using bitwise AND
    intersections = cv2.bitwise_and(vertical_lines, horizontal_lines)

    # Dilate the intersections to make them more visible
    kernel = np.ones((5, 5), np.uint8)
    dilated_intersections = cv2.dilate(intersections, kernel, iterations=1)

    # Find contours of the intersections
    contours, _ = cv2.findContours(dilated_intersections, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Extract the corner points
    corners = [cv2.boundingRect(cnt) for cnt in contours]
    corner_points = [(x + w//2, y + h//2) for (x, y, w, h) in corners]

    return corner_points, dilated_intersections

def find_top_left_corner(corner_points):
    # Identify the top-left corner as the point with the smallest x and y
    top_left_corner = min(corner_points, key=lambda p: p[0] + p[1])
    return top_left_corner

# Load the image
image_path = 'test.png'

def corner_test(image_path, kernel_size=50):
    image = cv2.imread(image_path)

    # Preprocess the image
    binary_image = preprocess_image(image)

    # Detect vertical and horizontal lines
    vertical_lines, horizontal_lines = detect_lines(binary_image, kernel_size=kernel_size)

    # Find corners from intersections of vertical and horizontal lines
    corner_points, dilated_intersections = find_corners(vertical_lines, horizontal_lines)

    # Find the top-left corner
    top_left_corner = find_top_left_corner(corner_points)

    # Draw the top-left corner on the image
    output_image = image.copy()

    for cp in corner_points:
        cv2.circle(output_image, cp, 10, (0, 255, 0), -1)

    # Display results
    s(binary_image, title='Binary Image')
    s(vertical_lines, title='Vertical Lines')
    s(horizontal_lines, title='Horizontal Lines')
    s(dilated_intersections, title='Intersections')
    s(output_image, title='Top-Left Corner')

if __name__ == '__main__':
    import sys

    kernel_size = 50
    if len(sys.argv) >= 2:
        image_path = sys.argv[1]
    if len(sys.argv) >= 3:
        kernel_size = int(sys.argv[2])

    corner_test(image_path, kernel_size=kernel_size)
