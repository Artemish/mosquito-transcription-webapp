var headerTypes = null;
var sidebar = {};
var fileList = [];

// Promise that resolves once headerTypes has been fetched.
// loadFileFromParam awaits this before calling setCurrentHeader.
var headerTypesReady = null;

function init_sidebar() { 
  const sidebarList = document.getElementById('file-list');
  const listHeader = document.getElementById('file-list-header');

  let prevSelection = null;
  let currentSelection = null;

  function setFileParam(file) {
    const url = new URL(window.location);
    url.searchParams.set('filename', file);
    window.history.pushState({}, '', url);
  }

  async function loadFileFromParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const filename = urlParams.get('filename');
    const file = (fileList.find(f => f.id == filename));

    if (file) {
      console.log(`Loading ${file.id} from URL params..`);
      // Ensure headerTypes is loaded before selectFile calls setCurrentHeader
      await headerTypesReady;
      await selectFile(file, 'transcription');

      const checkRow = urlParams.get('check_row');
      const checkCol = urlParams.get('check_col');
      if (checkRow !== null && checkCol !== null) {
        if (typeof transcription_tab !== 'undefined' && transcription_tab.focusCheck) {
          transcription_tab.focusCheck(Number(checkRow), Number(checkCol));
        }
      }
    }
  }

  async function selectFile(file, tab) {
    setFileParam(file.id);

    document_tab.reset();
    dewarp_tab.reset();
    transcription_tab.reset();

    current_file = file.id;
    prevSelection = file.element;
    sidebar.redraw();

    // Fetch document metadata (sets header) and transcription (sets points)
    // first, then fetch the image.  header and points must be populated before
    // any overlay drawing can happen, and fetchAndDisplayImage resolving is
    // what triggers callers to call focusCheck — so the data must be ready first.
    await fetchDocument(file);
    await fetchTranscription(file);

    if (! file.has_document) {
      await fetchAndDisplayImage(file.id, target="document");
      document_tab.focus();
      tab = tab || 'document';
    } else if (! file.has_table) {
      await fetchAndDisplayImage(file.id, target="dewarp");
      tab = tab || 'dewarp';
    } else {
      await fetchAndDisplayImage(file.id, target="transcription");
      tab = tab || 'transcription';
    }

    setTab(tab);
  };

  function markComplete() {
    let file = fileList.find(f => f.id == current_file);
    file.complete = true;

    sidebarList.removeChild(file.element);

    selectFile(fileList.find(f => !f.complete && f.id > current_file));

    let n_complete = fileList.filter(f => f.complete).length;
    listHeader.textContent = `Source Files (${n_complete} / ${fileList.length} complete)`;
  };

  function continueNext(tab) {
    let currentFile = fileList.find(f => f.id == current_file);
    let nextFile = currentFile;

    if (tab == 'document') {
      currentFile.has_document = true;
      nextFile = fileList.find(f => !f.has_document && f.id > current_file);
    } else if (tab == 'dewarp') {
      currentFile.has_table = true;
      nextFile = fileList.find(f => !f.has_table && f.id > current_file);
    } else if (tab == 'transcription') {
      currentFile.has_transcript = true;
      nextFile = fileList.find(f => !f.has_transcript && f.id > current_file);
    }

    redraw();
    selectFile(nextFile, tab);
  };

  function addFileElement(file) { 
    var listItem = document.createElement('tr');

    if (file.id == current_file) {
      listItem.classList.add('selected');
    }

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

  function redraw() { 
    sidebarList.innerHTML = '';

    let n_complete = fileList.filter(f => f.complete).length;
    listHeader.textContent = `Source Files (${n_complete} / ${fileList.length} complete)`;

    fileList.filter((file) => !file.complete).forEach(addFileElement);
  }

  async function loadFiles() {
    console.log("Reloading files");

    const response = await fetch('list_source_images');
    if (!response.ok) {
      alert(`Failed to load files: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    fileList = await response.json();

    redraw();
  }

  function initialize() {
    loadFiles().then(loadFileFromParam); 

    sidebar = {
      redraw: redraw,
      loadFiles: loadFiles,
      markComplete: markComplete,
      continueNext: continueNext,
      selectFileById: (id, tab) => {
        const file = fileList.find(f => f.id === id);
        if (file) return selectFile(file, tab);
        return Promise.resolve();
      },
    };

    // reload files every 15 minutes
    setInterval(loadFiles, 15 * 60 * 1000);
  }

  initialize();
}



async function loadHeaderTypes() {
  // Assuming an endpoint like `/list_header_types` that returns an array of image filenames
  const response = await fetch('static/header_types/headers.json');
  headerTypes = await response.json();
}

// Kick off the fetch immediately and store the promise so anything that needs
// headerTypes can await it regardless of when it was started.
headerTypesReady = loadHeaderTypes();

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
document.addEventListener('DOMContentLoaded', init_sidebar);
