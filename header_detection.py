import cv2
import numpy as np
from utils import s, show_contour, crop_to_points
from subset_table_warp import (
    filter_bounding_boxes,
    box_to_contour,
    contour_to_box
)

def column_contours(image, show=False):
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply adaptive thresholding
    thresholded = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                        cv2.THRESH_BINARY, 15, 6)

    # Detect vertical lines using Hough transform
    edges = cv2.Canny(thresholded, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=100, maxLineGap=10)

    # Detect vertical lines by examining each column
    line_image = np.zeros_like(thresholded)
    height, width = thresholded.shape
    for col in range(width):
        column_pixels = thresholded[:, col]
        if np.sum(column_pixels == 0) >= (height / 1.2):  # Consider it a line if half or more pixels are black
            line_image[:, col] = 255

    if show:
        s(thresholded, "Thresholded")
        s(edges, "Edges")
        s(line_image, "Vertical lines")

    # Apply contour detection on the dilated image
    inverted = (255 - line_image)
    contours, _ = cv2.findContours(inverted, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    return contours, image

def infer_column_structure(image, skip_names=False):
    # Process the image
    contours, header = column_contours(image)

    boxes = map(contour_to_box, contours)

    boxes = filter_bounding_boxes(
        boxes, min_aspect=0.12,
        max_aspect=15, min_area=200,
        max_area=30000
    )

    boxes = sorted(boxes)

    img_width = image.shape[1]
    boxes_xw_format = [{
        'x': box[0][0] / img_width,
        'w': (box[1][0] - box[0][0]) / img_width
    } for box in boxes]

    if skip_names:
        boxes_xw_format = [boxes_xw_format[0]] + boxes_xw_format[2:]

    return boxes_xw_format

def experiment_find_columns(image_path, expected_cols, points=[]):
    image = cv2.imread(image_path)

    if points:
        image = crop_to_points(image, points)

    height = image.shape[0]

    for start_y in range(100, (height-100), 25):
        cropped = image[start_y:start_y+100,:,:]
        boxes = infer_column_structure(cropped, skip_names=True)
        if len(boxes) == expected_cols:
            return boxes
        elif len(boxes) == (expected_cols + 1):
            return boxes[1:]

    print("Found no boxes!")

def experiment_find_rows(image_path, expected_rows, points=[]):
    image = cv2.imread(image_path)

    if points:
        image = crop_to_points(image, points)

    image = cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
    width = image.shape[1]

    for start_y in range(100, (width-100), 25):
        cropped = image[start_y:start_y+100,:,:]
        boxes = infer_column_structure(cropped, skip_names=False)
        if len(boxes) == expected_rows:
            return [{'h': box['w'], 'y': box['x']} for box in boxes]

    print("Found no boxes!")

if __name__ == '__main__':
    import sys
    image_path = sys.argv[1]
    image = cv2.imread(image_path)
    height = image.shape[0]
    
    for start_y in range(100, (height-100), 50):
        header = image[start_y:start_y+100,:,:]
        contours, _ = column_contours(header)
        print(contours)

        # Display the results
        s(header, 'Original Header')
        for (i, contour) in enumerate(contours):
            # Draw contours on the header for visualization
            # header_with_contours = cv2.cvtColor(header, cv2.COLOR_BGR2RGB)
            show_contour(header, contour)
            # cv2.drawContours(header_with_contours, [contour], -1, (0, 255, 0), 2)
            # s(header_with_contours, f'Contour {i}')

        boxes = infer_column_structure(header)
        print(f'Found {len(boxes)} boxes')
