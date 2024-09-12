var headerTypes = null;
var sidebar = {};
var fileList = [];


async function fetchFilesAndPopulateSidebar() {
    const sidebarList = document.getElementById('file-list');
    const listHeader = document.getElementById('file-list-header');
    let prevSelection = null;
    let currentSelection = null;

    let setFileParam = function(file) {
      const url = new URL(window.location);
      url.searchParams.set('filename', file);
      window.history.pushState({}, '', url);
    }

    let loadFileFromParam = function() { 
      const urlParams = new URLSearchParams(window.location.search);
      const filename = urlParams.get('filename');  // Get the value of the 'doc' parameter
      const file = (fileList.find(f => f.id == filename));

      if (file) {
        console.log(`Loading ${file.id} from URL params..`);
        selectFile(file);
      }
    }

    let selectFile = function(file) {
      file.element.classList.add('selected');
      setFileParam(file.id);

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

  function addFileElement(file) { 
    var listItem = document.createElement('tr');
    const docStyle = file.has_document ? "complete" : "empty";
    const tableStyle = file.has_table ? "complete" : "empty";
    const transcriptStyle = file.complete ?
      "complete"
      : file.has_transcript
      ? "incomplete"
      : "empty";


    listItem.innerHTML = `
      <td class="file-id">${file.id}</td>
      <td class="${docStyle}"> X </td>
      <td class="${tableStyle}"> X </td>
      <td class="${transcriptStyle}"> X </td>
    `;

    file.element = listItem;
    listItem.addEventListener('click', () => selectFile(file));

    sidebarList.appendChild(listItem);

    return listItem;
  }

  try {
    const response = await fetch('list_source_images');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    fileList = await response.json();

    sidebarList.innerHTML = '';

    let n_complete = fileList.filter(f => f.complete).length;
    listHeader.textContent = `Source Files (${n_complete} / ${fileList.length} complete)`;

    fileList.filter((file) => !file.complete).forEach(addFileElement);

    loadFileFromParam();
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
