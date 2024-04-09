import cv2 
import sys

def s(img, title='None'):
    cv2.imshow(title, img)

    while True:
        k = cv2.waitKey(0)
        if k == ord('q'):
            break
        elif k == ord('x'):
            cv2.destroyAllWindows()
            sys.exit(1)
        elif k == ord('v'):
            import pdb; pdb.set_trace()

    cv2.destroyAllWindows()

show = s
