import cv2
import numpy as np
from utils import s

def order_points(pts):
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def four_point_transform(image, pts, width, height):
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    dst = np.array([
        [0, 0],
        [width - 1, 0],
        [width - 1, height - 1],
        [0, height - 1]], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)

    warped = cv2.warpPerspective(image, M, (width, height))

    return warped


points = [(0,0), (100, 0), (200, 0), (200,200), (100,200), (0,200)]

def rebuild_img(img, points):
    points = [[int(point[0]), int(point[1])] for point in points]
    n_points = len(points)
    assert (n_points%2) == 0

    top_contour = sorted(points[:n_points//2], key=lambda p: p[0])
    bottom_contour = sorted(points[n_points//2:], key=lambda p: p[0])

    # Use top left and top right corner's X for width
    width = int(top_contour[-1][0] - top_contour[0][0])

    # Use top left and bottom left corner's Y for height
    height = int(bottom_contour[0][1] - top_contour[0][1])

    output = None

    for i in range(n_points//2-1):
        tl, bl = top_contour[i], bottom_contour[i]
        tr, br = top_contour[i+1], bottom_contour[i+1]
        sect_width = tr[0] - tl[0]
        # sect_height = bl[1] - tl[1]
        points = np.array([tl, tr, br, bl])
        section_slice = four_point_transform(img, points, sect_width, height)

        if output is None:
            output = section_slice
        else:
            output = np.hstack([output, section_slice])

    return output

if __name__ == '__main__':
    TEST_IMG = '/home/mitch/Pictures/grid.png'
    pic = cv2.imread(TEST_IMG)
    points = [[0,0],[250,100],[500,100],[500,400],[250,400],[0,500]]
    output = rebuild_img(pic, points)
    s(output)
