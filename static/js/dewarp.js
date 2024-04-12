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

    function initialize() {
        attachEventListeners();
    }

    function attachEventListeners() {
        detectTablesBtn.addEventListener('click', detectTables);
        dewarpBtn.addEventListener('click', applyDewarp);
        document.addEventListener('keypress', handleDewarpKeypress);
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
        const contour = contours[currentContour];

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
      const ctx = canvas.getContext('2d');
      console.log("Drawning contour:", contour);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (contour.length < 2) return; // Need at least two points to draw a line

      ctx.beginPath(); // Start a new path
      ctx.moveTo(contour[0][0], contour[0][1]); // Move the pen to the start point

      // Draw lines to subsequent points
      for (let i = 1; i < contour.length; i++) {
          ctx.lineTo(contour[i][0], contour[i][1]);
      }

      ctx.lineTo(contour[0][0], contour[0][1]); // Optional: Close the path back to the start point for a closed shape

      ctx.strokeStyle = 'red'; // Set the color of the contour
      ctx.lineWidth = 2; // Set the line width
      ctx.stroke(); // Render the path
    }
    
    initialize();
}

window.addEventListener('load', (event) => {
  init_dewarp();
});
