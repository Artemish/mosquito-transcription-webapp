from flask import Flask, request, jsonify, render_template, send_from_directory, Response
from flask_httpauth import HTTPBasicAuth
from flask_cors import CORS
from glob import glob

import base64
import re
import cv2
import numpy as np
import pandas as pd
import os
import json

from box_detection import box_extraction, bbs_to_array, coerce_to_grid
from subset_table_warp import find_contours, warp_hull
from contour_stitch import rebuild_img

from utils import show_contour, show

app = Flask(__name__)
CORS(app) # This will enable CORS for all routes and methods
auth = HTTPBasicAuth()

SOURCE_DIRECTORY = 'source_images'
TRANSCRIPT_DIRECTORY = 'transcriptions'
TABLE_IMG_DIRECTORY = 'table_images'

IMG_RE = re.compile('.*\.(png|jpg)')

users = {
    "alexa": "mosquito",
    "mitch": "mosquito",
}

with open('mozambique_districts.json') as districtfile:
    districts = json.load(districtfile)
    districts = sorted(districts, key=lambda x: x['district'])
    provinces = sorted(set([district['province'] for district in districts]))

@auth.get_password
def get_password(username):
    if username in users:
        return users.get(username)
    return None

@auth.error_handler
def unauthorized():
    return "Unauthorized Access", 401

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
@auth.login_required
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
@auth.login_required
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

        has_document = os.path.isfile(document_path)
        if has_document:
            with open(document_path) as docfile:
                complete = json.load(docfile).get('complete')
        else:
            complete = False

        return {
            'id': file_base,
            'complete': complete,
            'has_document': has_document,
            'has_table': os.path.isfile(dewarp_path),
            'has_transcript': os.path.isfile(transcript_path),
        }

    return [get_file_status(f) for f in filenames]


@app.route('/list_source_images', methods=['GET'])
@auth.login_required
def list_source_images():
    content = get_content_index()
    return jsonify(content), 200


@app.route('/upload', methods=['POST'])
@auth.login_required
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
@auth.login_required
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
@auth.login_required
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

    # stw = warp_hull(img, contour)
    stw = rebuild_img(img, contour)

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
@auth.login_required
def get_transcription(file_id):
    transcript_path = os.path.join(TRANSCRIPT_DIRECTORY, file_id + '_transcript.json')

    if os.path.isfile(transcript_path):
        with open(transcript_path) as tfile:
            return jsonify(json.load(tfile))

    # Return the segmentation result
    return jsonify(None)


@app.route('/document/<file_id>', methods=['GET'])
@auth.login_required
def get_document(file_id):
    document_path = os.path.join(TRANSCRIPT_DIRECTORY, file_id + '_document.json')

    if os.path.isfile(document_path):
        with open(document_path) as tfile:
            return jsonify(json.load(tfile))

    # Return the segmentation result
    return jsonify(None)


@app.route('/submit_document', methods=['POST'])
@auth.login_required
def submit_document():
    print(request.json)
    file_id = request.json['file_id']
    document_filename = file_id + '_document.json'
    with open(f'{TRANSCRIPT_DIRECTORY}/{document_filename}', 'w') as outfile:
        outfile.write(json.dumps(request.json, indent=2))

    # Return the segmentation result
    return jsonify(None)


@app.route('/submit_transcription', methods=['POST'])
@auth.login_required
def submit_transcription():
    print(request.json)
    filename = request.json['filename']
    transcript_filename = filename + '_transcript.json'
    with open(f'{TRANSCRIPT_DIRECTORY}/{transcript_filename}', 'w') as outfile:
        outfile.write(json.dumps(request.json, indent=2))

    # Return the segmentation result
    return jsonify(None)

@app.route('/mark_complete', methods=['POST'])
@auth.login_required
def mark_complete():
    filename = request.json['filename']
    document_path = f'{TRANSCRIPT_DIRECTORY}/{filename}_document.json'

    with open(document_path) as docfile:
        document = json.load(docfile)

    document['complete'] = True
    with open(document_path, 'w') as docfile:
        docfile.write(json.dumps(document, indent=2))

    # Return the segmentation result
    return jsonify(None)

@app.route('/download_csv', methods=['GET'])
@auth.login_required
def download_csv():
    result = pd.DataFrame()

    with open('static/header_types/headers.json') as hf:
        header_types = json.load(hf)
        header_map = {}
        for header in header_types:
            header_map[header['documentType']] = header

    for file in glob(f'{TRANSCRIPT_DIRECTORY}/*_transcript.json'):
        file_id = file[file.rindex('/')+1:-16]
        transcription = json.load(open(file))

        # print(json.dumps(transcription, indent=2))
        doctype = header_map[transcription['documentType']]
        columns = [c['translation'] for c in doctype['columns']]
        try:
            transcription_df = pd.DataFrame(
                transcription['transcriptions'],
                columns = columns
            )
            transcription_df['file_id'] = file_id
            transcription_df['document_type'] = transcription['documentType']
            result = pd.concat([result, transcription_df], axis=0)
        except Exception as e:
            print(f"Couldn't process {file}: {e}")

    csv = result.to_csv(index=False)
    
    # Create a response with the CSV data
    response = Response(
        csv,
        mimetype="text/csv",
        headers={
            "Content-disposition": "attachment; filename=transcription_results.csv"
        }
    )
    
    return response


@app.route('/download_documents_csv', methods=['GET'])
@auth.login_required
def download_documents_csv():
    result = pd.DataFrame()

    for file in glob(f'{TRANSCRIPT_DIRECTORY}/*_document.json'):
        print(file)
        file_id = file[file.rindex('/')+1:-14]
        document = json.load(open(file))
        try:
            document_df = pd.DataFrame([document])
            result = pd.concat([result, document_df])
        except:
            print(f"Couldn't process {file}")

    csv = result.to_csv(index=False)
    
    # Create a response with the CSV data
    response = Response(
        csv,
        mimetype="text/csv",
        headers={
            "Content-disposition": "attachment; filename=document_results.csv"
        }
    )
    
    return response


@app.route('/')
@auth.login_required
def home():
    return render_template(
        'index.html',
        districts = districts,
        provinces = provinces
    ) 

if __name__ == '__main__':
    app.run(debug=True)
