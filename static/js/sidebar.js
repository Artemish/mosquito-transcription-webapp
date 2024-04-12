async function fetchFilesAndPopulateSidebar() {
    const sidebarList = document.getElementById('file-list');
    let prevSelection = null;
    
    try {
        const response = await fetch('list_source_images');
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
              current_file = file.id;

              if (! file.has_document) {
                fetchAndDisplayImage(file.id, target="document"); 
                setTab('document');
              } else if (! file.has_table) {
                fetchAndDisplayImage(file.id, target="dewarp"); 
                setTab('dewarp');
              } else {
                fetchAndDisplayImage(file.id, target="transcription"); 
                setTab('transcription');
              }
            });
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadHeaderTypes() {
    const headerTypesDiv = document.getElementById('header-types');

    // Assuming an endpoint like `/list_header_types` that returns an array of image filenames
    const response = await fetch('static/header_types/headers.json');
    const headerTypes = await response.json();

    headerTypes.forEach(headerType => {
        const div = document.createElement('div');
        const img = document.createElement('img');
        img.src = `static/header_types/${headerType.filename}`;
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
