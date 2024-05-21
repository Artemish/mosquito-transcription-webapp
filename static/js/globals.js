let current_file = null;
let header = null;
let transcriptions = [];
let segmentationData = [];
let currentTab = "";
let points = [];

function setTab(tab) {
    // Get all elements with class="tab" and remove the class "selected"
    var tabs = document.getElementsByClassName("tab");
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(" selected", "");
    }

    const documentTab = document.getElementById('document-tab');
    const dewarpTab = document.getElementById('dewarp-tab');
    const transcriptionTab = document.getElementById('transcription-tab');
    const documentNav = document.getElementById('nav-document');
    const dewarpNav = document.getElementById('nav-dewarp');
    const transcriptionNav = document.getElementById('nav-transcription');

    fetchAndDisplayImage(current_file, tab);

    documentTab.style.display = "none";
    dewarpTab.style.display = "none";
    transcriptionTab.style.display = "none";

    if (tab == 'document') {
        // Add class "selected" to the tab that was clicked
        documentNav.className += " selected";
        documentTab.style.display = "";
        dewarpTab.style.display = "none";
        transcriptionTab.style.display = "none";
    } else if (tab == 'dewarp') {
        dewarpNav.className += " selected";
        documentTab.style.display = "none";
        dewarpTab.style.display = "";
        transcriptionTab.style.display = "none";
    } else if (tab == 'transcription') {
        transcriptionNav.className += " selected";
        documentTab.style.display = "none";
        dewarpTab.style.display = "none";
        transcriptionTab.style.display = "";
    }
}

async function fetchAndDisplayImage(file_id, target) {
    let canvas, container, imageDisplay, targetURL;

    if (target == 'document') {
      canvas = document.getElementById('document-overlay-canvas');
      container = document.getElementById('document-container');
      imageDisplay = document.getElementById('document-image-display');
      targetURL = `fetch_document/${file_id}`;
    } else if (target == 'transcription') {
      canvas = document.getElementById('transcription-overlay-canvas');
      container = document.getElementById('transcription-container');
      imageDisplay = document.getElementById('transcription-image-display');
      targetURL = `fetch_table/${file_id}`;
    } else if (target == 'dewarp') {
      canvas = document.getElementById('dewarp-overlay-canvas');
      container = document.getElementById('dewarp-container');
      imageDisplay = document.getElementById('dewarp-image-display');
      targetURL = `fetch_document/${file_id}`;
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
    };
    console.log(imageBlob);
    console.log(imageUrl);

    imageDisplay.src = imageUrl;

    current_file = file_id;
    fileHeader.textContent = current_file;
}

