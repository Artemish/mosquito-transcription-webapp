function init_transcription() {
    const cropBtn = document.getElementById('crop-btn');
    const submitBtn = document.getElementById('transcription-submit-btn');
    const enumTranscription = document.getElementById('enum-transcription');
    const textTranscription = document.getElementById('text-transcription');
    const imageDisplay = document.getElementById('transcription-image-display');
    const container = document.getElementById('container');
    const canvas = document.getElementById('transcription-overlay-canvas');
    const context = canvas.getContext('2d');
    const resultBox = document.getElementById('segmentation-result');
    const selectWall = document.getElementById('select-wall');

    let overlayVisible = false;
    let currentCellIndex = {row: 0, col: 0};
    let pauseCol = false;
    let wallCol = false;

    const currentCellView = document.getElementById('current-cell-view');
    const transcriptionInput = document.getElementById('transcription-input');

    function initialize() {
        attachEventListeners();
    }

    function attachEventListeners() {
        // fileInput.addEventListener('change', handleFileInputChange);
        imageDisplay.addEventListener('click', handleImageDisplayClick);
        cropBtn.addEventListener('click', handleCropButtonClick);
        document.addEventListener('keydown', handleTranscriptionInputKeydown);
        submitBtn.addEventListener('click', submitTranscription);
        selectWall.addEventListener('change', updateSelectWall);
    }

    function handleImageDisplayClick(e) {
        const rect = imageDisplay.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (points.length == 2) {
            points = [];
        }

        points.push({x: x, y: y});
        
        if (points.length === 2) {
            drawRectangle(points[0], points[1]);
        }

        console.log("New points:");
        console.log(points);
        console.log("Found canvas:");
        console.log(canvas);
    }

    function handleCropButtonClick() {
        if (points.length === 2) {
            const [point1, point2] = points;
            cropAndSendImage(point1, point2);
        }
    }

    function drawRectangle(startPoint, endPoint) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        context.rect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y);
        context.strokeStyle = 'red';
        context.stroke();
    }

    async function cropAndSendImage(point1, point2) {
        // Extract the crop area from the canvas (not the original image, for simplicity)
        const cropCanvas = document.createElement('canvas');
        const cropContext = cropCanvas.getContext('2d');
        const width = Math.abs(point2.x - point1.x);
        const height = Math.abs(point2.y - point1.y);
        cropCanvas.width = width;
        cropCanvas.height = height;

        // Assume point1 is the top-left corner for simplicity
        cropContext.drawImage(imageDisplay, point1.x, point1.y, width, height, 0, 0, width, height);
        
        // Convert the crop canvas to a Blob and send it to the Flask app
        cropCanvas.toBlob(async function(blob) {
            const formData = new FormData();
            formData.append('file', blob, 'crop.png');
            const response = await fetch('upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            displaySegmentationResult(data);
        }, 'image/png');
    }

    function displaySegmentationResult(data) {
        // Process data, draw bounding boxes as before
        segmentationData = data; // Store segmentation data globally
        transcriptions = data.map(row => row.map(() => "")); // Initialize transcription array
        selectCell(0, 0); // Start transcription with the top-left cell
    }

    function showWall(show) {
      if (show) {
        enumTranscription.style = "display: block";
        textTranscription.style = "display: none";
        selectWall.focus();
      } else {
        enumTranscription.style = "display: none";
        textTranscription.style = "display: block";
        transcriptionInput.focus();
      }
    }

    function deleteCurrentCell() {
      const [row, col] = [currentCellIndex.row, currentCellIndex.col];
      segmentationData[row].splice(col, 1);
      transcriptions[row].splice(col, 1);
      selectCell(row, col - 1);
    }

    function selectCell(rowIndex, colIndex) {
        currentCellIndex = {row: rowIndex, col: colIndex};
        const cell = segmentationData[rowIndex][colIndex];

        pauseCol = header?.columns[colIndex]?.pauseInput;
        wallCol = header?.columns[colIndex]?.enum == "wall";

        console.log(`Pausing: ${pauseCol}`);
        console.log(`wallCol: ${wallCol}`);

        showWall(wallCol);
        
        // Show zoomed cell view
        const cropCanvas = document.createElement('canvas');
        const cropContext = cropCanvas.getContext('2d');
        cropCanvas.width = cell.w;
        cropCanvas.height = cell.h;

        const [point1, point2] = points;

        cropContext.drawImage(imageDisplay, point1.x+cell.x, point1.y+cell.y, cell.w, cell.h, 0, 0, cell.w, cell.h);
        currentCellView.src = cropCanvas.toDataURL();
        currentCellView.style.display = 'block';
        currentCellView.width = 5 * cell.w
        currentCellView.height = 5 * cell.h

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        context.rect(cell.x+point1.x, cell.y+point1.y, cell.w, cell.h);
        context.strokeStyle = 'blue'; // Use blue for visibility
        context.stroke();
        
        // Show transcription input
        transcriptionInput.style.display = 'block';
        transcriptionInput.value = transcriptions[rowIndex][colIndex];
        transcriptionInput.focus(); // Focus on the input for immediate typing
    }

    // Handle transcription input and navigation
    function handleTranscriptionInputKeydown(e) {
        const maxRow = segmentationData.length - 1;
        let maxCol = segmentationData[currentCellIndex.row]?.length - 1;
        let newRow = currentCellIndex.row;
        let newCol = currentCellIndex.col;

        if (("0123456789".includes(e.key)) && !pauseCol) {
            transcriptions[newRow][newCol] = transcriptionInput.value + e.key;
            e.preventDefault(); // Prevent default to avoid keeping the value in the input
            newCol += 1;
        } else {
          switch(e.key) {
              case 'Enter':
                  // Store transcription
                  transcriptions[currentCellIndex.row][currentCellIndex.col] = transcriptionInput.value;
                  // Assume moving to the next cell (right) by default
                  newCol += 1;
                  break;
              case 'ArrowRight':
                  newCol += 1;
                  e.preventDefault(); // Prevent default to avoid moving the cursor in the input
                  break;
              case 'ArrowLeft':
                  newCol -= 1;
                  e.preventDefault();
                  break;
              case 'ArrowUp':
                  newRow -= 1;
                  e.preventDefault();
                  break;
              case 'ArrowDown':
                  newRow += 1;
                  e.preventDefault();
                  break;
              case ' ':
                  toggleTranscriptionOverlay();
                  e.preventDefault();
                  break;
              case 'X':
                  deleteCurrentCell();
                  e.preventDefault();
                  return;
              default:
                  return; // Skip any other keys
          }
        }

        // Adjust for navigation logic
        if (newCol > maxCol) {
            if (newRow < maxRow) {
                newRow += 1;
                newCol = 0; // Move to the beginning of the next row
            } else {
                // If at the last cell, wrap around or do nothing
                newCol = maxCol; // Stay at the last cell; remove this line to wrap around
            }
        } else if (newCol < 0) {
            if (newRow > 0) {
                newRow -= 1;
                newCol = segmentationData[newRow].length - 1; // Move to the end of the previous row
            } else {
                newCol = 0; // Stay at the first cell; remove this line to wrap around
            }
        }

        // Adjust for vertical navigation at the edges
        if (newRow > maxRow) {
            newRow = maxRow; // Stay at the last row; remove this line to wrap around
        } else if (newRow < 0) {
            newRow = 0; // Stay at the first row; remove this line to wrap around
        }

        // If navigation results in a valid cell, select the new cell
        if (newRow !== currentCellIndex.row || newCol !== currentCellIndex.col) {
            selectCell(newRow, newCol);
        }
    }

    function toggleTranscriptionOverlay() {
        overlayVisible = !overlayVisible; // Toggle overlay visibility
        if (overlayVisible) {
            drawTranscriptionOverlay();
        } else {
            clearTranscriptionOverlay();
        }
    }

    function drawTranscriptionOverlay() {
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear any existing overlay
        const [point1, point2] = points;
        segmentationData.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                // Draw a white rectangle for the cell
                context.fillStyle = 'rgba(255, 255, 255, 0.8)';
                context.fillRect(cell.x+point1.x, cell.y+point1.y, cell.w, cell.h);
                
                // Draw the transcription text
                const text = transcriptions[rowIndex][colIndex];
                if (text) {
                    context.font = '12px Arial';
                    context.fillStyle = 'black';
                    context.textBaseline = 'top';
                    context.fillText(text, cell.x + point1.x + 2, cell.y + point1.y + 2, cell.w - 4); // Adjust text position and max width as needed
                }
            });
        });
    }

    function clearTranscriptionOverlay() {
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear the overlay
        // Optionally, redraw anything that was there before, like cell outlines
    }

    async function submitTranscription() {
        const submission = {
          filename: current_file,
          segmentationData: segmentationData,
          transcriptions: transcriptions,
          header: header,
          points: points
        }

        const response = await fetch('submit_transcription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submission)
        });

        if (!response.ok) {
            console.error('Error in network response');
        }
    }

    async function updateSelectWall() {
      const selectedValue = this.value; // 'this' refers to the select element

      if (!selectedValue) {
        return;
      }

      const [row, col] = [currentCellIndex.row, currentCellIndex.col];
      transcriptions[row][col] = selectedValue;
      selectCell(row, col+1);

      console.log(`You selected: ${selectedValue}`);
      this.value = "";
    };

    initialize();
}

async function fetchTranscription(file) {
    const response = await fetch(`transcription/${file.id}`);
    
    if (!response.ok) {
        console.error(`Failed to fetch transcription: ${response.statusText}`);
        return;
    }

    const transcription = await response.json();
    console.log("Fetched transcription:");
    console.log(transcription);
    
    header = transcription?.header || null;
    transcriptions = transcription?.transcriptions || [];
    segmentationData = transcription?.segmentationData || [];
    points = transcription?.points || [];
}

window.addEventListener('load', (event) => {
  init_transcription();
});
