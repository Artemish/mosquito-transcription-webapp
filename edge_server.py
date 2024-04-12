from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS

import base64
import re
import cv2
import numpy as np
import os
import json

from box_detection import box_extraction, bbs_to_array, coerce_to_grid
from subset_table_warp import find_contours, warp_hull

from utils import show_contour, show

app = Flask(__name__)
CORS(app) # This will enable CORS for all routes and methods

SOURCE_DIRECTORY = 'source_images'
TRANSCRIPT_DIRECTORY = 'transcriptions'
TABLE_IMG_DIRECTORY = 'table_images'

IMG_RE = re.compile('.*\.(png|jpg)')

def process_image(file_stream):
    # Convert the uploaded file stream to a numpy array
    file_bytes = np.asarray(bytearray(file_stream.read()), dtype=np.uint8)
    image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    cv2.imwrite('last_input.png', image)

    # Dummy segmentation - Replace this with your actual segmentation logic
    # For demonstration, it returns a single cell covering a central part of the image
    boxes = box_extraction(image)
    ordered = bbs_to_array(boxes)
    grid = coerce_to_grid(ordered)

    return grid


@app.route('/fetch_table/<filename>', methods=['GET'])
def fetch_table(filename):
    try:
        # Ensure the filename is secure and prevents directory traversal
        if '..' in filename or filename.startswith('/'):
            return {"error": "Invalid filename."}, 400
        
        # Return the image file
        return send_from_directory(TABLE_IMG_DIRECTORY, filename + '_dewarped.png')
    except Exception as e:
        return {"error": str(e)}, 500

@app.route('/fetch_document/<filename>', methods=['GET'])
def fetch_document(filename):
    try:
        # Ensure the filename is secure and prevents directory traversal
        if '..' in filename or filename.startswith('/'):
            return {"error": "Invalid filename."}, 400
        
        # Return the image file
        return send_from_directory(SOURCE_DIRECTORY, filename + '.png')
    except Exception as e:
        return {"error": str(e)}, 500

def get_content_index():
    filenames = [
        f for f in os.listdir(SOURCE_DIRECTORY)
        if os.path.isfile(os.path.join(SOURCE_DIRECTORY, f))
        and IMG_RE.match(f)
    ]

    def get_file_status(file):
        file_base = file[:file.rindex('.')]
        document_path = os.path.join(TRANSCRIPT_DIRECTORY, file_base + '_document.json')
        dewarp_path = os.path.join(TABLE_IMG_DIRECTORY, file_base + '_dewarped.png')
        transcript_path = os.path.join(TRANSCRIPT_DIRECTORY, file_base + '_transcript.json')
        return {
            'id': file_base,
            'has_document': os.path.isfile(document_path),
            'has_table': os.path.isfile(dewarp_path),
            'has_transcript': os.path.isfile(transcript_path),
        }

    return [get_file_status(f) for f in filenames]


@app.route('/list_source_images', methods=['GET'])
def list_source_images():
    content = get_content_index()
    return jsonify(content), 200


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Process the image
    segmentation_result = process_image(file)

    # Return the segmentation result
    return jsonify(segmentation_result)


@app.route('/find_table', methods=['POST'])
def find_table():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    file_bytes = np.asarray(bytearray(file.read()), dtype=np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    # cv2.imwrite('last_dewarp_input.png', img)

    contours = find_contours(img)

    # Sending the encoded image along with additional data
    response_data = { "contours": contours }

    # Return the transformed image
    return jsonify(response_data)


@app.route('/dewarp_along_contour', methods=['POST'])
def dewarp_along_contour():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    contour = json.loads(request.form['contour'])

    with open('last_contour.json', 'w') as outf:
        outf.write(json.dumps(contour))

    contour = np.array(contour)

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    file_bytes = np.asarray(bytearray(file.read()), dtype=np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    stw = warp_hull(img, contour)

    dewarp_name = f'{TABLE_IMG_DIRECTORY}/{file.filename}_dewarped.png'
    cv2.imwrite(dewarp_name, stw)

    _, encoded_stw = cv2.imencode('.png', stw)
    b64_image = base64.b64encode(encoded_stw).decode('ascii')
        
    # Sending the encoded image along with additional data
    response_data = {
        "image": b64_image,
    }

    # Return the transformed image
    return jsonify(response_data)


@app.route('/transcription/<file_id>', methods=['GET'])
def get_transcription(file_id):
    transcript_path = os.path.join(TRANSCRIPT_DIRECTORY, file_id + '_transcript.json')

    if os.path.isfile(transcript_path):
        with open(transcript_path) as tfile:
            return jsonify(json.load(tfile))

    # Return the segmentation result
    return jsonify(None)


@app.route('/document/<file_id>', methods=['GET'])
def get_document(file_id):
    document_path = os.path.join(TRANSCRIPT_DIRECTORY, file_id + '_document.json')

    if os.path.isfile(document_path):
        with open(document_path) as tfile:
            return jsonify(json.load(tfile))

    # Return the segmentation result
    return jsonify(None)


@app.route('/submit_document', methods=['POST'])
def submit_document():
    print(request.json)
    file_id = request.json['file_id']
    document_filename = file_id + '_document.json'
    with open(f'{TRANSCRIPT_DIRECTORY}/{document_filename}', 'w') as outfile:
        outfile.write(json.dumps(request.json, indent=2))

    # Return the segmentation result
    return jsonify(None)


@app.route('/submit_transcription', methods=['POST'])
def submit_transcription():
    print(request.json)
    filename = request.json['filename']
    transcript_filename = filename + '_transcript.json'
    with open(f'{TRANSCRIPT_DIRECTORY}/{transcript_filename}', 'w') as outfile:
        outfile.write(json.dumps(request.json, indent=2))

    # Return the segmentation result
    return jsonify(None)


@app.route('/')
def home():
    return render_template('index.html')  # Assuming your HTML file is named 'index.html' and is located in the 'templates' folder

if __name__ == '__main__':
    app.run(debug=True)
