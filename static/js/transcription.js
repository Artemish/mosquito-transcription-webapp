var transcription_tab = null;

function init_transcription() {
    const submitBtn = document.getElementById('transcription-submit-btn');
    const markCompleteBtn = document.getElementById('transcription-complete-btn');
    const fixColsBtn = document.getElementById('transcription-fixcols-btn');
    const enumTranscription = document.getElementById('enum-transcription');
    const textTranscription = document.getElementById('text-transcription');
    const imageDisplay = document.getElementById('transcription-image-display');
    const container = document.getElementById('container');
    const canvas = document.getElementById('transcription-overlay-canvas');
    const context = canvas.getContext('2d');
    const resultBox = document.getElementById('segmentation-result');
    const selectWall = document.getElementById('select-wall');
    const transcriptionTab = document.getElementById('transcription-tab');

    let overlayVisible = false;
    let currentCellIndex = {row: 0, col: 0};
    let pauseCol = false;
    let wallCol = false;
    let queuedInput = "";

    const currentCellView = document.getElementById('current-cell-view');
    const transcriptionInput = document.getElementById('transcription-input');

    function initialize() {
        attachEventListeners();
        transcription_tab = {
          redraw: redraw,
          reset: reset
        };
	const resizeObserver = new ResizeObserver((entries) => {
	  for (let entry of entries) {
	    if (entry.target === imageDisplay) {
	      redraw();
	    }
	  }
	});

	// Start observing the element
	resizeObserver.observe(imageDisplay);
    }

    function reset() {
        imageDisplay.src = "";
        points = [];
        overlayVisible = false;
        currentCellIndex = {row: 0, col: 0};

        if (header) {
          default_transcriptions = header.row_structure.map((_, rowIndex) => header.column_structure.map((_, colIndex) => colIndex == 0 ? (rowIndex + 1).toString() : ""));
          transcriptions = default_transcriptions;
          points = header.points;
        } else {
          transcriptions = [];
        }
    }

    function attachEventListeners() {
        // fileInput.addEventListener('change', handleFileInputChange);
        imageDisplay.addEventListener('click', handleImageDisplayClick);
        window.addEventListener('keydown', handleTranscriptionInputKeydown);
        submitBtn.addEventListener('click', submitTranscription);
        markCompleteBtn.addEventListener('click', markComplete);
        fixColsBtn.addEventListener('click', fixColumns);
        // selectWall.addEventListener('change', updateSelectWall);
        transcriptionInput.addEventListener('input', redraw);
    }

    function handleImageDisplayClick(e) {
        const rect = imageDisplay.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (points.length == 2) {
            points = [];
        }

        points.push({x: x / imageDisplay.width, y: y / imageDisplay.height});

        if (points.length == 2) {
          selectCell(0, 1);
        }

        console.log("Settings points: ", points);
        
        redraw();
    }

    // Return the points in real pixel space, scaled to the image
    function imagePoints() {
        const imageWidth = imageDisplay.width;
        const imageHeight = imageDisplay.height;

        return points.map((point) => ({x: point.x * imageWidth, y: point.y * imageHeight}));
    }

    const findOptionsByPrefix = (selectElement, prefix) => 
      Array.from(selectElement.options).filter(option => option.text.toLowerCase().startsWith(prefix));

    function checkForInputPattern(val) {
      let header_col = header.columns[currentCellIndex.col];
      if (header_col.translation == 'latitude' || header_col.translation == 'longitude') {
        if (currentCellIndex.row == 0) {
          let prefix = val.slice(0, val.indexOf('.')+1);
          if (prefix == "") {
            prefix = val.slice(0, 2);
          }

          if (prefix != "") {
            transcriptions.forEach((row) => {
              row[currentCellIndex.col] = row[currentCellIndex.col] || prefix
            });
          }
        }
      }
    }

    function redraw() {
        const imageWidth = imageDisplay.width;
        const imageHeight = imageDisplay.height;

        canvas.width = imageWidth;
        canvas.height = imageHeight;

        context.clearRect(0, 0, canvas.width, canvas.height); // Clear the overlay

        if (points.length == 1) {
          const point = imagePoints()[0];
          context.fillStyle = 'rgb(255, 0, 0)';
          context.fillRect(point.x, point.y, 20, 4);
          context.fillRect(point.x, point.y, 4, 20);
        } else if (points.length == 2) {
          const [point1, point2] = imagePoints();
          context.beginPath();
          context.lineWidth = 2;
          context.rect(point1.x, point1.y, point2.x - point1.x, point2.y - point1.y);
          context.strokeStyle = 'blue';
          context.stroke();

          if (overlayVisible) {
              drawTranscriptionOverlay();
          } 

          outlineCurrentCell();
        }
    }

    function outlineCurrentCell() {
        const cell = cellToRect(currentCellIndex.row, currentCellIndex.col);

        context.beginPath();
        context.rect(cell.x-2, cell.y-2, cell.w+2, cell.h+2);
        context.strokeStyle = 'red';
        context.stroke();

        const redText = queuedInput || transcriptionInput.value;

        if (redText) {
            context.font = '20px Arial';
            context.fillStyle = 'red';
            context.textBaseline = 'top';
            context.fillText(redText, cell.x + 2, cell.y + 2, cell.w - 4); // Adjust text position and max width as needed
        }
    }

    function drawRectangle(startPoint, endPoint) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.beginPath();
        context.rect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y);
        context.strokeStyle = 'red';
        context.stroke();
    }

    // function displaySegmentationResult(data) {
    //     // Process data, draw bounding boxes as before
    //     segmentationData = data; // Store segmentation data globally
    //     transcriptions = data.map(row => row.map(() => "")); // Initialize transcription array
    //     selectCell(0, 0); // Start transcription with the top-left cell
    // }

    function showWall(show) {
      if (show) {
        enumTranscription.style = "display: block";
        textTranscription.style = "display: none";
        selectWall.focus({preventScroll: true});
      } else {
        enumTranscription.style = "display: none";
        textTranscription.style = "display: block";
        transcriptionInput.focus({preventScroll: true});
      }
    }

    // function deleteCurrentCell() {
    //   const [row, col] = [currentCellIndex.row, currentCellIndex.col];
    //   segmentationData[row].splice(col, 1);
    //   transcriptions[row].splice(col, 1);
    //   selectCell(row, col - 1);
    // }

    function selectCell(rowIndex, colIndex) {
        currentCellIndex = {row: rowIndex, col: colIndex};
        const cell = cellToRect(rowIndex, colIndex);

        queuedInput = "";
        pauseCol = header.columns[colIndex].pauseInput;
        wallCol = header.columns[colIndex].enum == "wall";

        if (wallCol) {
          selectWall.value = transcriptions[rowIndex][colIndex];
        }

        console.log(`Pausing: ${pauseCol}`);
        console.log(`wallCol: ${wallCol}`);

        showWall(wallCol);
        
        // Show zoomed cell view
        const cropCanvas = document.createElement('canvas');
        const cropContext = cropCanvas.getContext('2d');

        const buffer = 10;
        const dispHeight = cell.h + 2*buffer;
        const dispWidth = cell.w + 2*buffer;

        const r_w = imageDisplay.naturalWidth / imageDisplay.width;
        const r_h = imageDisplay.naturalHeight / imageDisplay.height;

        cropCanvas.width = dispWidth;
        cropCanvas.height = dispHeight;
        cropContext.drawImage(imageDisplay, (cell.x - buffer) * r_w, (cell.y - buffer) * r_h, dispWidth, dispHeight, 0, 0, dispWidth, dispHeight);

        currentCellView.src = cropCanvas.toDataURL();
        currentCellView.style.display = 'block';
        currentCellView.width = 5 * dispWidth
        currentCellView.height = 5 * dispHeight

        // Show transcription input
        transcriptionInput.style.display = 'block';
        transcriptionInput.value = transcriptions[rowIndex][colIndex];
        if (!wallCol) {
          transcriptionInput.focus({preventScoll: true}); // Focus on the input for immediate typing
        }

        redraw();
    }

    // Handle transcription input and navigation
    function handleTranscriptionInputKeydown(e) {
        if (currentTab != "transcription") {
          return;
        }

        const maxRow = header.row_structure.length - 1;
        const minCol = 1; // Don't allow editing the house number
        let maxCol = header.column_structure.length - 1;
        let newRow = currentCellIndex.row;
        let newCol = currentCellIndex.col;

        if (("0123456789".includes(e.key)) && !pauseCol) {
            transcriptions[newRow][newCol] = transcriptionInput.value + e.key;
            e.preventDefault(); // Prevent default to avoid keeping the value in the input
            newRow += 1;
        } else if (e.key.match(/^[a-z]$/) && wallCol) {
          queuedInput += e.key;
          let options = findOptionsByPrefix(selectWall, queuedInput);
          if (options.length == 1) {
              newRow += 1;
              transcriptions[currentCellIndex.row][currentCellIndex.col] = options[0].value;
              e.preventDefault();
          } else if (options.length == 0) {
            queuedInput = "";
          } 
        } else {
          switch(e.key) {
              case 'Enter':
                  // Store transcription
                  if (wallCol) {
                    transcriptions[currentCellIndex.row][currentCellIndex.col] = selectWall.value;
                  } else {
                    transcriptions[currentCellIndex.row][currentCellIndex.col] = transcriptionInput.value;
                  }
                  checkForInputPattern(transcriptionInput.value);
                  // Assume moving to the next cell (right) by default
                  newRow += 1;
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
              //case 'X':
              //    deleteCurrentCell();
              //    e.preventDefault();
              //    return;
              default:
                  return; // Skip any other keys
          }
        }

        // Adjust for navigation logic
        if (newCol > maxCol) {
            if (newRow < maxRow) {
                newRow += 1;
                newCol = minCol; // Move to the beginning of the next row
            } else {
                // If at the last cell, wrap around or do nothing
                newCol = maxCol; // Stay at the last cell; remove this line to wrap around
            }
        } else if (newCol < minCol) {
            if (newRow > 0) {
                newRow -= 1;
                newCol = maxCol - 1; // Move to the end of the previous row
            } else {
                newCol = minCol; // Stay at the first cell; remove this line to wrap around
            }
        }

        // Adjust for vertical navigation at the edges
        if (newRow > maxRow) {
            if (newCol < maxCol) {
              newRow = 0; // Stay at the last row; remove this line to wrap around
              newCol += 1;
            } else {
              newRow = maxRow;
            }
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
        redraw();
    }

    function cellToRect(rowIndex, colIndex) {
        const imageWidth = imageDisplay.width;
        const imageHeight = imageDisplay.height;

        const row = header.row_structure[rowIndex];
        const col = header.column_structure[colIndex];
        
        const [point1, point2] = points;

        const tableWidth = (point2.x - point1.x) * imageWidth;
        const tableHeight = (point2.y - point1.y) * imageHeight;

        return {
            x: (point1.x * imageWidth) + (col.x * tableWidth),
            w: (col.w * tableWidth),
            y: (point1.y * imageHeight) + (row.y * tableHeight),
            h: (row.h * tableHeight)
        };
    }

    function setFontSizeToFit(text, size) {
        console.log(`Fitting text ${text} to size ${size}`);
        let fontSize = 24;
        context.font = `${fontSize} Arial`;
        let textWidth = context.measureText(text).width;

        while (textWidth > size) {
            fontSize--;
            context.font = `${fontSize}px Arial`;
            textWidth = context.measureText(text).width;
            console.log(`Reducing text(${text}) to size ${fontSize} (calculated ${textWidth})`);
        }
    }

    function drawTextToBox(text, x, y, w, h) {
      var words = text.split(" ");
      var lines = [];
      var line = words[0];
      var startY = 2;

      for (var i = 1; i < words.length; i++) {
        var newline = line + " " + words[i];
        if (context.measureText(newline).width > (w * 1.2)) {
          lines.push(line);
          line = words[i];
        } else {
          line = newline;
        }
      }

      lines.push(line);

      lines.forEach((line, lineNo) => {
        context.fillText(line, x, startY, w);
        startY += 16;
      });
    }

    function drawColumnNames() {
        header.column_structure.forEach((col, colIndex) => {
          const cell = cellToRect(0, colIndex); 
          // End the column just above the first cell
          const bottomExtent = cell.y - 5
          const text = header.columns[colIndex].original;

          // Draw a white rectangle for the cell
          context.fillStyle = 'rgba(255, 255, 255, 0.6)';
          context.fillRect(cell.x, 0, cell.w, bottomExtent);

          let x = cell.x;
          let y = bottomExtent;
          let drawVertical = cell.y > (cell.w * 1.5);

          context.font = `20 Arial`;
          context.fillStyle = 'black';
          context.textBaseline = 'top';

          if (text && drawVertical) {
              context.save();
              context.translate(x, y);
              context.rotate(-1 * Math.PI / 2);
              // setFontSizeToFit(text, cell.y - 4);
              // context.fillText(text, 2, 2, cell.y - 4); // Adjust text position and max width as needed
              drawTextToBox(text, 2, 2, cell.y - 4, cell.w - 4);
              context.restore();
          } else {
              // setFontSizeToFit(text, cell.w - 4);
              // context.fillText(text, x, 2, cell.w - 4); // Adjust text position and max width as needed
              drawTextToBox(text, x + 2, y + 2, cell.w - 4, y - 4);
          }
        });
    }

    function drawTranscriptionOverlay() {
        drawColumnNames();

        header.row_structure.forEach((row, rowIndex) => {
            header.column_structure.forEach((col, colIndex) => {
                // Translate the ratio coordinates to pixel coordinates
                const cell = cellToRect(rowIndex, colIndex);

                // Draw a white rectangle for the cell
                context.fillStyle = 'rgba(255, 255, 255, 0.6)';
                context.fillRect(cell.x, cell.y, cell.w, cell.h);
                
                // Draw the transcription text
                const text = transcriptions[rowIndex][colIndex];
                if (text) {
                    context.font = '20px Arial';
                    context.fillStyle = 'green';
                    context.textBaseline = 'top';
                    context.fillText(text, cell.x + 2, cell.y + 2, cell.w - 4); // Adjust text position and max width as needed
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
          transcriptions: transcriptions,
          documentType: header.documentType,
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
            alert(`Could not save transcription: ${response.text}`);
        } else {
            alert(`Transcription saved for ${current_file}`);
        }
    }

    async function markComplete() {
        submitTranscription();

        const submission = {
          filename: current_file,
        }

        const response = await fetch('mark_complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submission)
        });

        if (!response.ok) {
            alert(`Could not mark as complete: ${response.text}`);
        } else {
            alert(`Document ${current_file} marked as complete`);
            sidebar.markComplete();
        }
    }

    async function fixColumns() {
        const submission = {
          filename: current_file,
        }

        const response = await fetch('fix_columns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submission)
        });

        const result = await response.json();

        if (!response.ok) {
            alert(`Failed to fix columns: ${result}`);
            return;
        }

        header.column_structure = result;
        redraw();
    }

    async function updateSelectWall() {
      const selectedValue = this.value; // 'this' refers to the select element

      if (!selectedValue) {
        return;
      }

      const [row, col] = [currentCellIndex.row, currentCellIndex.col];
      transcriptions[row][col] = selectedValue;
      selectCell(row+1, col);

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

    const default_transcriptions = header.row_structure.map((_, rowIndex) => header.column_structure.map((_, colIndex) => colIndex == 0 ? (rowIndex + 1).toString() : ""));
    
    transcriptions = transcription?.transcriptions || default_transcriptions;
    console.log("Set transcriptions to: ", transcriptions);
    points = transcription?.points || header?.points || [];
}

window.addEventListener('load', (event) => {
  init_transcription();
});
