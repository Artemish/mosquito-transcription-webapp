from utils import s
from glob import glob

import shutil
import os
import cv2

def ret_true():
    return True


complete_imgs = """
IMG-0575_redacted.png
IMG-0576_redacted.png
IMG-0577_redacted.png
IMG-0578_redacted.png
IMG-0579_redacted.png
IMG-0580_redacted.png
IMG-20230720-WA0013_redacted.png
IMG-20230720-WA0014_redacted.png
IMG-20230720-WA0015_redacted.png
IMG-20230720-WA0016_redacted.png
IMG-20230720-WA0017_redacted.png
IMG-20230720-WA0018_redacted.png
IMG-20230720-WA0019_redacted.png
IMG-20230720-WA0020_redacted.png
IMG-20230720-WA0021_redacted.png
IMG-20230720-WA0022_redacted.png
IMG-20230720-WA0023_redacted.png
IMG-20230720-WA0024_redacted.png
IMG-20230720-WA0025_redacted.png
IMG-20230720-WA0026_redacted.png
IMG-20230720-WA0027_redacted.png
IMG-20230720-WA0028_redacted.png
IMG-20230720-WA0029_redacted.png
IMG-20230720-WA0030_redacted.png
IMG-20230720-WA0031_redacted.png
IMG-20230720-WA0032_redacted.png
IMG-20230720-WA0033_redacted.png
IMG-20230720-WA0034_redacted.png
IMG-20230720-WA0035_redacted.png
IMG-20230720-WA0036_redacted.png
IMG-20230720-WA0037_redacted.png
IMG-20230720-WA0038_redacted.png
IMG-20230720-WA0039_redacted.png
IMG-20230720-WA0040_redacted.png
IMG-20230720-WA0041_redacted.png
IMG-20230720-WA0042_redacted.png
IMG-20230720-WA0043_redacted.png
IMG-20230720-WA0044_redacted.png
IMG-20230720-WA0045_redacted.png
IMG-20230720-WA0046_redacted.png
IMG-20230720-WA0047_redacted.png
IMG-20230720-WA0048_redacted.png
IMG-20230720-WA0049_redacted.png
IMG-20230720-WA0050_redacted.png
IMG-20230720-WA0051_redacted.png
IMG-20230720-WA0052_redacted.png
IMG-20230720-WA0053_redacted.png
IMG-20230720-WA0054_redacted.png
IMG-20230720-WA0055_redacted.png
IMG-20230720-WA0056_redacted.png
IMG-20230720-WA0057_redacted.png
IMG-20230720-WA0058_redacted.png
IMG-20230720-WA0059_redacted.png
IMG-20230720-WA0060_redacted.png
IMG-20230720-WA0061_redacted.png
IMG-20230720-WA0062_redacted.png
IMG-20230720-WA0063_redacted.png
IMG-20230720-WA0064_redacted.png
IMG-20230720-WA0065_redacted.png
IMG-20230720-WA0066_redacted.png
IMG-20230720-WA0067_redacted.png
IMG-20230720-WA0068_redacted.png
IMG-20230720-WA0069_redacted.png
IMG-20230720-WA0070_redacted.png
PHOTO-2023-08-18-07-20-36_redacted.png
PHOTO-2023-08-21-15-10-03_redacted.png
""".split()

keyfuncs = {'y': ret_true}
source_images = glob('d2/table_images/*.png')

if __name__ == '__main__':
    for img_path in source_images:
        img = cv2.imread(img_path)
        fname = os.path.basename(img_path)
        fname = fname.replace('_dewarped.png', '.png')

        if fname in complete_imgs:
            print(f"Skipping {fname}")
            continue

        do_rm = s(img, keyfuncs=keyfuncs)
        if do_rm:
            print(f'Deleting {img_path}..')
            os.remove(img_path)

