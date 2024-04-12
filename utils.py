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

def show_contour(img, contour):
    # Draw the approximated contour
    img_with_approx = img.copy()
    cv2.drawContours(img_with_approx, [contour], 0, (0, 0, 255), 5)
    
    show(img_with_approx)
