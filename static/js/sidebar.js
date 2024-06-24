var headerTypes = null;

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

              document_tab.reset();
              dewarp_tab.reset();
              transcription_tab.reset();

              prevSelection = listItem;
              console.log(file);

              fetchDocument(file).then((_) => fetchTranscription(file));
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
    // Assuming an endpoint like `/list_header_types` that returns an array of image filenames
    const response = await fetch('static/header_types/headers.json');
    headerTypes = await response.json();
}

function setCurrentHeader(documentType) {
    console.log(`Current header set to: ${documentType}`);
    if (documentType == "") {
      header = null;
    }

    headerTypes.forEach(headerType => {
      if (headerType.documentType == documentType) {
        header = headerType;
      }
    });

    const doctypeInput = document.getElementById('document-type');
    doctypeInput.value = header?.documentType || "";
}

// Call the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', fetchFilesAndPopulateSidebar);
document.addEventListener('DOMContentLoaded', loadHeaderTypes);
