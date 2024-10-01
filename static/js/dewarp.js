let dewarp_tab = {};

function init_dewarp() {
    const dewarpBtn = document.getElementById('dewarp-btn');
    const resetBtn = document.getElementById('reset-btn');
    const imageDisplay = document.getElementById('dewarp-image-display');
    const container = document.getElementById('container');
    const canvas = document.getElementById('dewarp-overlay-canvas');
    const context = canvas.getContext('2d');
    const threshold = 10;

    var currentImage = null;
    var contours = [];
    var currentContour = null;
    let isDragging = false;
    let draggedPointIndex = null;

    var points = [];

    function initialize() {
        attachEventListeners();
        dewarp_tab = {
          reset: reset
        };
    }

    function reset() {
      imageDisplay.src = "";
      contours = [];
      points = [];
      currentContour = null;
      redraw();
      dewarpBtn.disabled = true;

    }

    function handleMouseDown(e) {
      console.log("Mousedown");
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if the click is near any existing points
      for (let i = 0; i < points.length; i++) {
        const [px, py] = points[i];
        const distance = Math.sqrt((px - x) ** 2 + (py - y) ** 2);

        if (distance < threshold) {
          // Start dragging the point
          isDragging = true;
          draggedPointIndex = i;
          break;
        }
      }

      if (!isDragging) {
        points.push([x, y])
        isDragging = true;
        draggedPointIndex = points.length - 1;
        dewarpBtn.disabled = false;
      }

      e.preventDefault();
      redraw();
    }

    function handleMouseMove(e) {
      console.log("Mousemove");
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isDragging && draggedPointIndex !== null) {
        // Update the position of the dragged point
        points[draggedPointIndex] = [x, y];
        redraw();  // Redraw the canvas with updated points
      } 

      e.preventDefault();
    }

    function handleMouseUp(e) {
      console.log("Mouseup");
      if (isDragging) {
        isDragging = false;
        draggedPointIndex = null;
      } 

      redraw();  // Redraw the canvas with updated points
    }
  

    function attachEventListeners() {
        dewarpBtn.addEventListener('click', applyDewarp);
        resetBtn.addEventListener('click', clearPoints);
        // Attach the event listeners to the canvas
        imageDisplay.addEventListener('mousedown', handleMouseDown);
        imageDisplay.addEventListener('mousemove', handleMouseMove);
        imageDisplay.addEventListener('mouseup', handleMouseUp);
    }

    function clearPoints() {
      points = [];
      redraw();
    }

    function redraw() {
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        drawContour(points);
          // Find the transition point
        const transitionIndex = findTopBottomTransition(points, threshold);

        if (transitionIndex !== null) {
            console.log("Transition found at index:", transitionIndex);
            drawLinesBetweenTopAndBottom(context, points, transitionIndex);
        } else {
            console.log("No transition found");
        }
    }

    function handleImageClick(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        points.push([x,y]);
        console.log("Using points: ", points);

        redraw();
    }

    async function applyDewarp() {
        const contour = contours.length ? contours[currentContour] : points;

        // Convert the crop canvas to a Blob and send it to the Flask app
        context.drawImage(imageDisplay, 0, 0, imageDisplay.width, imageDisplay.height);

        canvas.toBlob(async function(blob) {
            console.log("Dewarping!");
            const formData = new FormData();
            formData.append('file', blob, current_file);
            formData.append('contour', JSON.stringify(contour));

            const response = await fetch('dewarp_along_contour', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                console.error(`Failed to fetch image: ${response.statusText}`);
                return;
            }
        
            const responseData = await response.json();

            reset();
            fetchAndDisplayImage(current_file, target="transcription"); 
            
            sidebar.continueNext();
        }, 'image/png');
    }

    // Function to calculate the angle between three points
    function calculateAngle(p0, p1, p2) {
        // Create vectors P0->P1 and P1->P2
        const vectorA = [p1[0] - p0[0], p1[1] - p0[1]];  // Vector P0->P1
        const vectorB = [p2[0] - p1[0], p2[1] - p1[1]];  // Vector P1->P2

        // Calculate the dot product of the two vectors
        const dotProduct = (vectorA[0] * vectorB[0]) + (vectorA[1] * vectorB[1]);

        // Calculate the magnitude of the vectors
        const magnitudeA = Math.sqrt((vectorA[0] ** 2) + (vectorA[1] ** 2));
        const magnitudeB = Math.sqrt((vectorB[0] ** 2) + (vectorB[1] ** 2));

        // Calculate the cosine of the angle between the vectors
        const cosineOfAngle = dotProduct / (magnitudeA * magnitudeB);

        // Calculate the angle in radians, then convert to degrees
        const angleRadians = Math.acos(cosineOfAngle);
        const angleDegrees = angleRadians * (180 / Math.PI);

        return angleDegrees;
    }

    // Function to find the point where the top half stops and bottom half begins
    function findTopBottomTransition(points, threshold = 70) {
        for (let i = 1; i < points.length - 1; i++) {
            const angle = calculateAngle(points[i - 1], points[i], points[i + 1]);

            if (angle >= threshold) {
                return i + 1; // This is the point where the bottom half begins
            }
        }
        return null; // No transition found
    }

    // Function to draw a line between top and bottom half matching points
    function drawLinesBetweenTopAndBottom(canvasContext, points, transitionIndex) {
        const numTopPoints = transitionIndex; // Points from 0 to transitionIndex-1 are the top half
        const numBottomPoints = points.length - transitionIndex; // Remaining points are the bottom half

        context.strokeStyle = 'blue';

        // Draw lines between matching points on the top and bottom halves
        for (let i = 0; i < Math.min(numTopPoints, numBottomPoints); i++) {
            const topPoint = points[transitionIndex - 1 - i];
            const bottomPoint = points[transitionIndex + i];

            // Draw a line between the top and bottom points
            canvasContext.beginPath();
            canvasContext.moveTo(topPoint[0], topPoint[1]);
            canvasContext.lineTo(bottomPoint[0], bottomPoint[1]);
            canvasContext.stroke();
        }
    }

    function drawContour() {
      console.log("Drawning points:", points);
      context.font = '20px Arial';
      context.fillStyle = 'red';
      context.strokeStyle = 'green';
      context.lineWidth = 2;

      for (let i = 0; i < points.length; i++) {
          const point = points[i];

          // Draw point
          context.fillText(String(i+1), point[0]-10, point[1]-10);
          context.beginPath();
          context.arc(point[0], point[1], 3, 0, 2 * Math.PI);
          context.fill();

          // Draw line to the next point
          if (i > 0) {
              const prevPoint = points[i - 1];
              context.beginPath();
              context.moveTo(prevPoint[0], prevPoint[1]);
              context.lineTo(point[0], point[1]);
              context.stroke();
          }
      }
    }
    
    initialize();
}

window.addEventListener('load', (event) => {
  init_dewarp();
});
