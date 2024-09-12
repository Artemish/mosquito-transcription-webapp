import cv2 
import sys
import json

def s(img, title='None', keyfuncs={}):
    cv2.imshow(title, img)
    ret = None

    while True:
        k = cv2.waitKey(0)
        dofunc = keyfuncs.get(chr(k))

        if k == ord('q'):
            break
        elif k == ord('x'):
            cv2.destroyAllWindows()
            sys.exit(1)
        elif k == ord('v'):
            import pdb; pdb.set_trace()
        elif dofunc is not None:
            ret = dofunc()
            break

    cv2.destroyAllWindows()
    return ret

show = s

def show_contour(img, contour):
    # Draw the approximated contour
    img_with_approx = img.copy()
    cv2.drawContours(img_with_approx, [contour], 0, (0, 0, 255), 5)

    show(img_with_approx)

from copy import deepcopy

header_index = -1

def get_current_cols():
    filename = 'static/header_types/headers.json'
    with open(filename) as hf:
        headers = json.load(hf)
    return headers[header_index]['column_structure']

def expand_col_bbs_left(pct):
    new_cols = deepcopy(get_current_cols())
    n_cols = len(new_cols)
    for i in range(n_cols-1, 0, -1):
        col = new_cols[i]
        expand_margin = col['w'] * pct
        col['w'] += expand_margin
        col['x'] -= expand_margin
        for pre_col in new_cols[1:i]:
            pre_col['x'] -= expand_margin
    update_headers(new_cols)
    return new_cols

def expand_col_right(i, margin):
    new_cols = deepcopy(get_current_cols())
    new_cols[i]['w'] += margin
    new_cols[i+1]['x'] += margin
    new_cols[i+1]['w'] -= margin
    update_headers(new_cols)
    return new_cols

def shift_col(i, val):
    new_cols = deepcopy(get_current_cols())
    new_cols[i]['x'] += val

    if val > 0:
        new_cols[i+1]['x'] += val
        new_cols[i+1]['w'] -= val
        new_cols[i-1]['w'] += val
    else:
        new_cols[i-1]['w'] -= abs(val)
        new_cols[i+1]['w'] += abs(val)
        new_cols[i+1]['x'] -= abs(val)

    update_headers(new_cols)


def update_headers(new_cols):
    filename = 'static/header_types/headers.json'
    with open(filename) as hf:
        headers = json.load(hf)
    headers[header_index]['column_structure'] = new_cols
    with open(filename, 'w') as outf:
        outf.write(json.dumps(headers, indent=2))

## Make a structure outline for a new document type
def generate_structure(n_rows, n_cols, margin):
    column_structure = []
    row_structure = []

    # Calculate the width of each column and height of each row, considering the margin
    col_width = (1 - margin * (n_cols + 1)) / n_cols
    row_height = (1 - margin * (n_rows + 1)) / n_rows

    # Generate column_structure
    for i in range(n_cols):
        x_position = margin + i * (col_width + margin)
        column_structure.append({'x': x_position, 'w': col_width})

    # Generate row_structure
    for j in range(n_rows):
        y_position = margin + j * (row_height + margin)
        row_structure.append({'y': y_position, 'h': row_height})

    return column_structure, row_structure
