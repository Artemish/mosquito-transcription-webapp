async function fetchFilesAndPopulateSidebar() {
    const sidebarList = document.getElementById('file-list');
    let prevSelection = null;
    
    try {
        const response = await fetch('http://localhost:5000/list_source_images');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fileList = await response.json();

        sidebarList.innerHTML = '';

        fileList.forEach(file => {
            const listItem = document.createElement('li');
            listItem.textContent = file.id;
            if (file.has_transcript) {
                listItem.classList.add('has-transcript');
            } else if (file.has_table) {
                listItem.classList.add('has-table');
            } else if (file.has_document) {
                listItem.classList.add('has-document');
            }

            sidebarList.appendChild(listItem);

            listItem.addEventListener('click', () => {
              listItem.classList.add('selected');

              if (prevSelection) {
                prevSelection.classList.remove('selected');
              }

              prevSelection = listItem;
              console.log(file);

              fetchDocument(file);
              fetchTranscription(file);

              if (! file.has_document) {
                fetchAndDisplayImage(file, target="document"); 
                setTab('document');
              } else if (! file.has_table) {
                // fetchAndDisplayImage(file, target="dewarp"); 
                setTab('dewarp');
              } else {
                fetchAndDisplayImage(file, target="transcription"); 
                setTab('transcription');
              }
            });
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchAndDisplayImage(file, target) {
    let canvas, container, imageDisplay, targetURL;

    if (target == 'document') {
      canvas = document.getElementById('document-overlay-canvas');
      container = document.getElementById('document-container');
      imageDisplay = document.getElementById('document-image-display');
      targetURL = `http://localhost:5000/fetch_document/${file.id}`;
    } else if (target == 'transcription') {
      canvas = document.getElementById('transcription-overlay-canvas');
      container = document.getElementById('transcription-container');
      imageDisplay = document.getElementById('transcription-image-display');
      targetURL = `http://localhost:5000/fetch_table/${file.id}`;
    } else {
      throw Error('Unknown target: ' + target);
    }

    const fileHeader = document.getElementById('current-filename');

    const response = await fetch(targetURL);
    
    if (!response.ok) {
        console.error(`Failed to fetch image: ${response.statusText}`);
        return;
    }
    
    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);

    imageDisplay.onload = function() {
        canvas.width = imageDisplay.width;
        canvas.height = imageDisplay.height;
        container.style.width = `${imageDisplay.width}px`;
        container.style.height = `${imageDisplay.height}px`;
    };

    imageDisplay.src = imageUrl;

    current_file = file.id;
    fileHeader.textContent = current_file;
}

async function fetchTranscription(file) {
    const response = await fetch(`http://localhost:5000/transcription/${file.id}`);
    
    if (!response.ok) {
        console.error(`Failed to fetch transcription: ${response.statusText}`);
        return;
    }

    const transcription = await response.json();
    console.log("Fetched transcription:");
    console.log(transcription);
    
    header = transcription.header;
    transcriptions = transcription.transcriptions;
    segmentationData = transcription.segmentationData;
    points = transcription.points;
}

async function fetchDocument(file) {
    const response = await fetch(`http://localhost:5000/document/${file.id}`);

    const districtInput = document.getElementById('document-district');
    const collectDateInput = document.getElementById('document-collection-date');
    const sprayYearInput = document.getElementById('document-year-sprayed');
    const doctypeInput = document.getElementById('document-type');
    
    if (!response.ok) {
        console.error(`Failed to fetch transcription: ${response.statusText}`);
        return;
    }

    const doc = await response.json();
    districtInput.value = doc?.district || "";
    collectDateInput.value = doc?.district || "";
    sprayYearInput.value = doc?.spray_year || "";
    doctypeInput.value = doc?.doctype || "";
}

async function loadHeaderTypes() {
    const headerTypesDiv = document.getElementById('header-types');

    // Assuming an endpoint like `/list_header_types` that returns an array of image filenames
    const response = await fetch('http://localhost:5000/static/header_types/headers.json');
    const headerTypes = await response.json();

    headerTypes.forEach(headerType => {
        const div = document.createElement('div');
        const img = document.createElement('img');
        img.src = `http://localhost:5000/static/header_types/${headerType.filename}`;
        img.alt = headerType;
        img.style.cursor = 'pointer'; // Make it visually obvious it's clickable
        img.onclick = () => setCurrentHeader(headerType);
        
        div.appendChild(img);
        headerTypesDiv.appendChild(div);
    });
}

function setCurrentHeader(headerType) {
    console.log(`Current header set to: ${headerType}`);
    header = headerType;
    // Perform actions based on the selected header type, such as updating a variable or UI elements
}

// Call the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', fetchFilesAndPopulateSidebar);
document.addEventListener('DOMContentLoaded', loadHeaderTypes);
