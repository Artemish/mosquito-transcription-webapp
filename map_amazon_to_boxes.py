import sys
import json
import difflib
import copy
import re

from process_image import textract_image

WALL_TYPES = [wt.lower() for wt in [
    "Alvenaria", "Bloco", "Canico", "Cimento", "Convencional",
    "Macuti", "Madeira", "Maticado", "Matope", "Misto", "Paupica",
    "Pedra", "Rebocado",
]]

FLOOR_TYPES = [ft.lower() for ft in [
    "Areia", "Cimento", "Maticado", "Chapa", "Pavimentado", "Tijolo"
]]

CEILING_TYPES = [ct.lower() for ct in [
    "Capim", "Caniço", "Chapa", "Palha", "Placa", "Plastico", "Telha",
    "Macute", "Zinco",
]]

def keep_digits(string):
    if string is None:
        return None

    return re.sub(r'[^\d]', '', string)


def guess_enum_type(string, enum_type):
    if string is None:
        return None
    
    choices = {
        'wall': WALL_TYPES,
        'floor': FLOOR_TYPES,
        'ceiling': CEILING_TYPES,
    }.get(enum_type)

    closest_match = difflib.get_close_matches(string.lower(), choices, n=1, cutoff=0.6)

    if closest_match:
        output = closest_match[0]
        if output == "canico":
            return "Caniço"

        return output[0].upper() + output[1:]


def midpoint(box):
  x = round(box['x'] + box['w'] / 2, 3)
  y = round(box['y'] + box['h'] / 2, 3)
  return x, y


def map_point_to_indices(point, lookup, reverse):
    tree_index = lookup.query(point)[1]
    ## The tree returns a numpy array, convert to tuple for indexing
    tree_point = tuple(lookup.data[tree_index])
    return reverse.get(tree_point)

## Amazon reports bounding boxes relative to the whole document,
## where our column/row structures are relative to the data
## rows only, delineated by the "points" box. 
def rowspace_to_docspace(point, data_box):
    (p_x1, p_y1) = float(data_box[0]['x']), float(data_box[0]['y'])
    (p_x2, p_y2) = float(data_box[1]['x']), float(data_box[1]['y'])
    w = p_x2 - p_x1
    h = p_y2 - p_y1
    return p_x1 + (point[0] * w), p_y1 + (point[1] * h)

## Returns a KDtree for nearest neighbor lookup, and
## a reverse map for turning that point into (i, j) indices
def make_cell_tree(doctype):
  col_struct, row_struct = doctype['column_structure'], doctype['row_structure']
  n_cols, n_rows = len(col_struct), len(row_struct)

  boxes = [
    [{**row_struct[i], **col_struct[j]} for j in range(n_cols)]
    for i in range(n_rows)
  ]

  reverse_map = {}
  for i in range(n_rows):
    for j in range(n_cols):
      mp = midpoint(boxes[i][j])
      mp = rowspace_to_docspace(mp, doctype['points'])
      # print(f'{midpoint(boxes[i][j])} -> ({i},{j})')
      reverse_map[mp] = (i, j)

  midpoints = [midpoint(box) for row in boxes for box in row]
  docspace_midpoints = [rowspace_to_docspace(mp, doctype['points']) for mp in midpoints]

  from scipy.spatial import KDTree
  lookup_map = KDTree(docspace_midpoints)

  return lookup_map, reverse_map

def attempt_transcription(doctype, source_file, data_box=None, cols=None):
    if cols:
        doctype['column_structure'] = cols

    col_struct = doctype['column_structure']

    if data_box:
        doctype['points'] = data_box

    lookup, reverse = make_cell_tree(doctype)

    n_cols, n_rows = len(doctype['column_structure']), len(doctype['row_structure'])

    result = [[None for col in range(n_cols)] for row in range(n_rows)]

    # with open(f'{BASE_DIR}/textract_example.json') as textract_example:
    #     textracted = json.load(textract_example)

    textracted = textract_image(source_file)

    for word in textracted.words:
        midpoint = (
            word.bbox.x + word.bbox.width / 2,
            word.bbox.y + word.bbox.height / 2,
        )

        nearest_point = lookup.query(midpoint, distance_upper_bound = 0.04)[1]
        if nearest_point == len(lookup.data):
            continue

        p_x, p_y = lookup.data[nearest_point]
        i, j = reverse[(p_x, p_y)]
        text = word.text

        cell_width = col_struct[j]['w']
        if (word.bbox.width > cell_width * 3):
            print(f"Found big word: {text}")
            chars = len(text)
            char_width = word.bbox.width / chars
            for i_c, c in enumerate(text):
                char_center = word.bbox.x + char_width * (0.5 + i_c)
                mp = (char_center, word.bbox.y + word.bbox.height / 2)
                np = lookup.query(mp, distance_upper_bound = 0.04)[1]
                if np == len(lookup.data):
                    continue
                p_x, p_y = lookup.data[np]
                i, j = reverse[(p_x, p_y)]
                print(f'Putting text fragment {c} at [{i}, {j}]')
                result[i][j] = c
        else:
            print(f'Found text `{text}` for ({i}, {j})')
            result[i][j] = text

    return result


def data_to_dataframe(data, doctype):
    column_names = [column['translation'] for column in doctype['columns']]

    return pd.DataFrame(data, columns=column_names)


def remap_columns(data, doctype):
    output = copy.deepcopy(data)
    col_struct, row_struct = doctype['column_structure'], doctype['row_structure']
    n_cols, n_rows = len(col_struct), len(row_struct)

    for c_i in range(n_cols):
        column_type = doctype['columns'][c_i]
        enum = column_type.get('enum')

        if enum:
            for r_i in range(n_rows):
                guess = guess_enum_type(data[r_i][c_i], enum)
                if guess:
                    guess = guess.replace(',', '.')

                output[r_i][c_i] = guess
        elif column_type['translation'] == 'latitude':
            for r_i in range(n_rows):
                orig = data[r_i][c_i]
                long = data[r_i][c_i+1]

                guess = orig
                if long and 'E' in long and orig and orig[0] in ['5', '$', '8']:
                    guess = 'S' + orig[1:]

                if guess:
                    guess = guess.replace(',', '.')

                output[r_i][c_i] = guess

        elif column_type['translation'] not in ['latitude', 'longitude']:
            for r_i in range(n_rows):
                output[r_i][c_i] = keep_digits(data[r_i][c_i])

    return output


with open(f'static/header_types/headers.json') as header_file:
    HEADERS = json.load(header_file)

DOCTYPE_MAP = {}

for header in HEADERS:
    DOCTYPE_MAP[header['documentType']] = header


if __name__ == '__main__':
    docpath, source_image = sys.argv[1:]

    with open(docpath) as docfile:
        document = json.load(docfile)

    doctype = DOCTYPE_MAP[document['doctype']]

    ts = attempt_transcription(doctype, source_image)
