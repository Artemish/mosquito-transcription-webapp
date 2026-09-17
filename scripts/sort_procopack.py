from utils import s
from glob import glob

import os
import json
import shutil
import cv2

def ret_true():
    return True

keyfuncs = {'y': ret_true}
source_images = glob('source_images/*.png')

def doc_complete(img_path):
    file_name = os.path.basename(img_path)
    doc_path = 'transcriptions/' + file_name.replace('.png', '_document.json')
    if os.path.exists(doc_path):
        return True
    else:
        return False

if __name__ == '__main__':
    for img_path in source_images:
        if doc_complete(img_path):
            continue
        img = cv2.imread(img_path)
        img = cv2.resize(img, (1280, 700))
        img = img[:400,:,:]
        img = cv2.resize(img, (1280, 700))

        do_copy = s(img, img_path, keyfuncs=keyfuncs)
        if do_copy:
            print(f'Copying {img_path}..')
            shutil.copy(img_path, 'doctype_identification/procopack')
