let current_file = null;
let header = null;
let transcriptions = [];
let segmentationData = [];
let currentTab = "";
let points = [];

function setTab(tab) {
    const documentTab = document.getElementById('document-tab');
    const dewarpTab = document.getElementById('dewarp-tab');
    const transcriptionTab = document.getElementById('transcription-tab');

    documentTab.style.display = "none";
    dewarpTab.style.display = "none";
    transcriptionTab.style.display = "none";

    if (tab == 'document') {
        documentTab.style.display = "";
        dewarpTab.style.display = "none";
        transcriptionTab.style.display = "none";
    } else if (tab == 'dewarp') {
        documentTab.style.display = "none";
        dewarpTab.style.display = "";
        transcriptionTab.style.display = "none";
    } else if (tab == 'transcription') {
        documentTab.style.display = "none";
        dewarpTab.style.display = "none";
        transcriptionTab.style.display = "";
    }
}

