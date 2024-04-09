import cv2
import sys
import json

from copy import deepcopy

import numpy as np

from utils import s
from subset_table_warp import *

def crop_to_box(img, cell):
    topleft = cell['x'], cell['y']
    bottomright = cell['x']+cell['w'], cell['y']+cell['h']

    x_slice = slice(topleft[0], bottomright[0])
    y_slice = slice(topleft[1], bottomright[1])

    return img[y_slice, x_slice, :]

def box_extraction(img, save_boxes=False):
    n_iter, kernel_div, block_size, C = 1, 40, 7, 1

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.Canny(gray, 20, 200)

    s(gray)

    img_bin = cv2.adaptiveThreshold(gray,255,cv2.ADAPTIVE_THRESH_MEAN_C,cv2.THRESH_BINARY,block_size,C)

    img_bin = 255-img_bin  # Invert the image
    cv2.imwrite("Image_bin.jpg",img_bin)

    # Defining a kernel length
    kernel_length = np.array(gray).shape[1] // kernel_div

    # A verticle kernel of (1 X kernel_length), which will detect all the verticle lines from the image.
    verticle_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, kernel_length//2))
    # A horizontal kernel of (kernel_length X 1), which will help to detect all the horizontal line from the image.
    hori_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_length, 1))
    # A kernel of (3 X 3) ones.
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))# Morphological operation to detect verticle lines from an image
    img_temp1 = cv2.erode(img_bin, verticle_kernel, iterations=n_iter)
    verticle_lines_img = cv2.dilate(img_temp1, verticle_kernel, iterations=n_iter)

    s(verticle_lines_img)

    cv2.imwrite("verticle_lines.jpg",verticle_lines_img)# Morphological operation to detect horizontal lines from an image
    img_temp2 = cv2.erode(img_bin, hori_kernel, iterations=1)
    horizontal_lines_img = cv2.dilate(img_temp2, hori_kernel, iterations=n_iter)

    s(horizontal_lines_img)

    cv2.imwrite("horizontal_lines.jpg",horizontal_lines_img)# Weighting parameters, this will decide the quantity of an image to be added to make a new image.
    alpha = 0.5
    beta = 1.0 - alpha
    # This function helps to add two image with specific weight parameter to get a third image as summation of two image.
    img_final_bin = cv2.addWeighted(verticle_lines_img, alpha, horizontal_lines_img, beta, 0.0)
    img_final_bin = cv2.erode(~img_final_bin, kernel, iterations=n_iter)
    (thresh, img_final_bin) = cv2.threshold(img_final_bin, 128, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)# For Debugging
    # Enable this line to see verticle and horizontal lines in the image which is used to find boxes
    cv2.imwrite("img_final_bin.jpg",img_final_bin)

    s(img_final_bin)

    # Find contours for image, which will detect all the boxes
    contours, hierarchy = cv2.findContours(img_final_bin, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    # Sort all the contours by top to bottom.

    idx = 0

    result = []

    for c in contours:
        # Returns the location and width,height for every contour
        x, y, w, h = cv2.boundingRect(c)
        if w in range(10, 140) and h in range(10, 60):
            result += [{'x': x, 'y': y, 'w': w, 'h': h}]

    return result


def table_extraction(img):
    n_iter, kernel_div, block_size, C = 2, 60, 7, 5

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.Canny(gray, 50, 200)

    contours, hier = cv2.findContours(gray, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    contours = [c for c in contours if cv2.contourArea(c) >= 200000]

    result = []

    return [warp_hull(img, c) for c in contours]


def bbs_to_array(bounding_boxes, y_threshold=10):
    # Sort boxes by 'y' to make grouping into rows easier
    sorted_boxes = sorted(bounding_boxes, key=lambda box: box['y'])

    # Group boxes by rows based on 'y' values
    rows = []
    current_row = []
    last_y = sorted_boxes[0]['y'] if sorted_boxes else None

    for box in sorted_boxes:
        if abs(box['y'] - last_y) <= y_threshold:
            current_row.append(box)
        else:
            # Sort the current row by 'x' before adding to rows
            rows.append(sorted(current_row, key=lambda box: box['x']))
            current_row = [box]
        last_y = box['y']

    # Don't forget to add the last row
    if current_row:
        rows.append(sorted(current_row, key=lambda box: box['x']))

    return rows

def coerce_to_grid(bb):
    # Get the 'canonical width' of each column
    columns, rows = max([len(row) for row in bb]), len(bb)
    # import pdb; pdb.set_trace()

    canonical_widths = []
    canonical_heights = []

    split_margin = 6

    output = deepcopy(bb)

    def calc_canonical():
        widths = []
        heights = []

        rows, columns = len(output), max([len(row) for row in output])

        for c_i in range(columns):
            cell_widths = [output[r_i][c_i]['w'] for r_i in range(rows) if len(output[r_i]) - 1 >= c_i][:3]
            widths += [np.median(cell_widths)]

        for r_i in range(rows):
            cell_heights = [output[r_i][c_i]['h'] for c_i in range(columns) if len(output[r_i]) - 1 >= c_i][:3]
            heights += [np.median(cell_heights)]

        return widths, heights, rows, columns

    def fix_cell(r, c, split_margin=3):
        cell = output[r][c]

        canonical_height = int(canonical_heights[r])
        canonical_width = int(canonical_widths[c])

        height_error_margin = max(0.35 * canonical_height, 6)
        width_error_margin = max(0.35 * canonical_width, 6)

        if (abs(cell['w'] - canonical_width) < width_error_margin):
            if (abs(cell['h'] - canonical_height) < height_error_margin):
                return

        print(f'Fixing {r}, {c}')

        est_ncells_tall = 0

        ypos = cell['y']
        while (ypos+8) < (cell['y'] + cell['h']):
            if r+est_ncells_tall >= rows:
                break
            ypos += canonical_heights[r+est_ncells_tall]
            est_ncells_tall += 1

        est_ncells_wide = 0

        xpos = cell['x']
        while (xpos+8) < (cell['x'] + cell['w']):
            if c+est_ncells_wide >= columns:
                break
            xpos += canonical_widths[c+est_ncells_wide]
            est_ncells_wide += 1

        subcell_width = (cell['w'] - split_margin * (est_ncells_wide-1)) // est_ncells_wide
        subcell_height = (cell['h'] - split_margin * (est_ncells_tall-1)) // est_ncells_tall

        del output[r][c]

        # outline_boxes(img, [cell])
        new_cells = []

        new_y = cell['y']
        for scan_h in range(est_ncells_tall):
            new_x = cell['x']

            for scan_w in range(est_ncells_wide):
                new_cell = {
                    'x': new_x,
                    'y': new_y,
                    'w': int(canonical_widths[c+scan_w]) - 1,
                    'h': int(canonical_heights[r+scan_h]) - 1
                }

                new_x = new_cell['x'] + new_cell['w'] + split_margin
                new_cells += [new_cell]

                output[r+scan_h].insert(c+scan_w, new_cell)

            new_y = new_cell['y'] + new_cell['h'] + split_margin

        # outline_boxes(img, new_cells)

    canonical_widths, canonical_heights, rows, columns = calc_canonical()

    # Iterate diagonally through the boxes
    for diag in range(rows+columns):
        entries = min(diag+1, rows)
        entries = min(entries, columns)
        scoot = max(diag - rows, 0)

        r_i, c_i = entries - 1, scoot
        # print(f'{diag} ({scoot}):')

        for i in range(entries):
            canonical_widths, canonical_heights, rows, columns = calc_canonical()

            if r_i >= len(output) or c_i >= len(output[r_i]):
                continue

            fix_cell(r_i, c_i)

            r_i -= 1
            c_i += 1

    return output

def outline_boxes(img, boxes, color=(128,0,255)):
    if type(boxes[0]) == list:
        boxes = [box for row in boxes for box in row]

    show = img.copy()

    for box in boxes:
        topleft = box['x'], box['y']
        bottomright = box['x']+box['w'], box['y']+box['h']
        show = cv2.rectangle(show, topleft, bottomright, color, 2)

    s(show)

if __name__ == '__main__':
    source_image = sys.argv[1]
    img = cv2.imread(source_image)  # Read the image

    # result = box_extraction(img)

    # ordered = bbs_to_array(result)
    # gridded = coerce_to_grid(ordered)

    table = table_extraction(img)

    # outline_boxes(img, ordered)
    # outline_boxes(img, gridded)

    # print(json.dumps(result, indent=2))
