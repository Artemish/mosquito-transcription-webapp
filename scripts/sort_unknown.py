from utils import s
from glob import glob

import shutil
import cv2

def ret_true():
    return True

keyfuncs = {'y': ret_true}
source_images = glob('source_images/*.png')

if __name__ == '__main__':
    for img_path in source_images:
        img = cv2.imread(img_path)
        img = cv2.resize(img, (1280, 700))
        img = img[:400,:,:]
        img = cv2.resize(img, (1280, 700))

        do_copy = s(img, keyfuncs=keyfuncs)
        if do_copy:
            print(f'Copying {img_path}..')
            shutil.copy(img_path, 'unknown_documents')
