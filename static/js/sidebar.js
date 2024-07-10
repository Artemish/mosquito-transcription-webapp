var headerTypes = null;
var sidebar = {};
var fileList = [];

async function fetchFilesAndPopulateSidebar() {
    const sidebarList = document.getElementById('file-list');
    const listHeader = document.getElementById('file-list-header');
    let prevSelection = null;
    let currentSelection = null;

    let selectFile = function(file) {
      file.element.classList.add('selected');

      if (prevSelection) {
        prevSelection.classList.remove('selected');
      }

      document_tab.reset();
      dewarp_tab.reset();
      transcription_tab.reset();

      prevSelection = file.element;
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
    };

    sidebar.markComplete = function() {
      let file = fileList.find(f => f.id == current_file);
      file.complete = true;

      sidebarList.removeChild(file.element);

      selectFile(fileList.find(f => !f.complete));

      let n_complete = fileList.filter(f => f.complete).length;
      listHeader.textContent = `Source Files (${n_complete} / ${fileList.length} complete)`;
    };

    try {
        const response = await fetch('list_source_images');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        fileList = await response.json();

        sidebarList.innerHTML = '';

        let n_complete = fileList.filter(f => f.complete).length;
        listHeader.textContent = `Source Files (${n_complete} / ${fileList.length} complete)`;


        fileList.forEach(file => {
            if (file.complete) {
              return;
            }

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
            file.element = listItem;

            listItem.addEventListener('click', () => selectFile(file));
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
