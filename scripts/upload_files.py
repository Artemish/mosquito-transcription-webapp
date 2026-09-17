from openai import OpenAI
from glob import glob

import os

client = OpenAI()

source_dir = './source_images'

def upload_file(file_path):
    file = client.files.create(
        file=open(file_path, "rb"),
        purpose="vision",
    )

    return file

def get_uploaded_files():
    file_list = client.files.list()
    return file_list

def ensure_all_uploaded():
    uploaded_files = get_uploaded_files()
    uploaded_filenames = set([file.filename for file in uploaded_files])

    all_image_files = glob(f'{source_dir}/*.png')
    unuploaded_filepaths = [
        fp for fp in all_image_files if os.path.basename(fp) not in uploaded_filenames
    ]

    print(f"Found {len(unuploaded_filepaths)} unuploaded files")

    for filepath_to_upload in unuploaded_filepaths:
        fname = os.path.basename(filepath_to_upload)
        print(f'Uploading {fname}...')
        upload_file(filepath_to_upload)

if __name__ == '__main__':
    ensure_all_uploaded() 
