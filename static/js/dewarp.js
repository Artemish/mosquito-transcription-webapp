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
    }

    function handleImageClick(e) {
        dewarpBtn.disabled = false;

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
            setTab('transcription');
        }, 'image/png');
    }

    function drawContour() {
      console.log("Drawning points:", points);
      context.font = '20px Arial';
      context.fillStyle = 'red';
      context.strokeStyle = 'black';
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
