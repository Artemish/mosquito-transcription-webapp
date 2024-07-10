let dewarp_tab = {};

function init_dewarp() {
    const dewarpBtn = document.getElementById('dewarp-btn');
    const detectTablesBtn = document.getElementById('detect-tables-btn');
    const imageDisplay = document.getElementById('dewarp-image-display');
    const container = document.getElementById('container');
    const canvas = document.getElementById('dewarp-overlay-canvas');
    const context = canvas.getContext('2d');

    var currentImage = null;
    var contours = [];
    var currentContour = null;

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
    }

    function attachEventListeners() {
        detectTablesBtn.addEventListener('click', detectTables);
        dewarpBtn.addEventListener('click', applyDewarp);
        document.addEventListener('keypress', handleDewarpKeypress);
        imageDisplay.addEventListener('click', handleImageClick);
    }

    function handleDewarpKeypress(e) {
      console.log(e.key);
      if ((e.key == '[') && (currentContour > 0)) {
        currentContour -= 1;
        console.log(`Drawing ${currentContour}..`);
        drawContour(contours[currentContour]);
      } else if ((e.key == ']') && (currentContour+1 < contours.length)) {
        currentContour += 1;
        drawContour(contours[currentContour]);
        console.log(`Drawing ${currentContour}..`);
      }
    }

    function handleImageClick(e) {
        dewarpBtn.style.display = "";

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        points.push([x,y]);
        console.log("Using points: ", points);

        context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        context.fillStyle = 'red';
        context.strokeStyle = 'black';
        context.lineWidth = 2;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];

            // Draw point
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

    async function detectTables() {
        console.log("Detecting!");

        // Convert the crop canvas to a Blob and send it to the Flask app
        context.drawImage(imageDisplay, 0, 0, imageDisplay.width, imageDisplay.height);

        canvas.toBlob(async function(blob) {
            console.log("Tables!");
            const formData = new FormData();
            formData.append('file', blob, 'document.png');

            const response = await fetch('find_table', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                console.error(`Failed to fetch image: ${response.statusText}`);
                return;
            }
        
            const responseData = await response.json();
            contours = responseData.contours;
            currentContour = 0;
            drawContour(contours[0]);
            dewarpBtn.style.display = "";
        }, 'image/png');
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

            fetchAndDisplayImage(current_file, target="transcription"); 
            setTab('transcription');
        }, 'image/png');
    }

    function drawContour(contour) {
      const context = canvas.getContext('2d');
      console.log("Drawning contour:", contour);
      context.clearRect(0, 0, canvas.width, canvas.height);

      if (contour.length < 2) return; // Need at least two points to draw a line

      context.beginPath(); // Start a new path
      context.moveTo(contour[0][0], contour[0][1]); // Move the pen to the start point

      // Draw lines to subsequent points
      for (let i = 1; i < contour.length; i++) {
          context.lineTo(contour[i][0], contour[i][1]);
      }

      context.lineTo(contour[0][0], contour[0][1]); // Optional: Close the path back to the start point for a closed shape

      context.strokeStyle = 'red'; // Set the color of the contour
      context.lineWidth = 2; // Set the line width
      context.stroke(); // Render the path
    }
    
    initialize();
}

window.addEventListener('load', (event) => {
  init_dewarp();
});
