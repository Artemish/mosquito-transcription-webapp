// Upload modal functionality

let uploadQueue = [];

function openUploadModal() {
    const modal = document.getElementById('upload-modal');
    modal.classList.add('show');
    
    // Initialize upload functionality if not already done
    if (typeof initUploadTab === 'function') {
        initUploadTab();
    }
    
    // Load documents list when opening modal
    loadDocumentsList();
}

function closeUploadModal() {
    const modal = document.getElementById('upload-modal');
    modal.classList.remove('show');
}

// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
    const modal = document.getElementById('upload-modal');
    if (event.target === modal) {
        closeUploadModal();
    }
});

function initUploadTab() {
    const fileInput = document.getElementById('file-input');
    const folderInput = document.getElementById('folder-input');
    const uploadBtn = document.getElementById('upload-btn');
    const clearQueueBtn = document.getElementById('clear-queue-btn');
    const refreshBtn = document.getElementById('refresh-documents-btn');
    const filterInput = document.getElementById('filter-documents');

    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        handleFileSelection(e.target.files);
    });

    // Handle folder selection
    folderInput.addEventListener('change', (e) => {
        handleFileSelection(e.target.files);
    });

    // Handle upload button
    uploadBtn.addEventListener('click', () => {
        uploadFiles().then(() => { sidebar.loadFiles(); });
    });

    // Handle clear queue button
    clearQueueBtn.addEventListener('click', () => {
        clearUploadQueue();
    });

    // Handle refresh button
    refreshBtn.addEventListener('click', () => {
        loadDocumentsList();
    });

    // Handle filter input
    filterInput.addEventListener('input', (e) => {
        filterDocuments(e.target.value);
    });

    // Load documents list on init
    loadDocumentsList();
}

function handleFileSelection(files) {
    const fileArray = Array.from(files);
    
    // Filter for image files only
    const imageFiles = fileArray.filter(file => {
        return file.type === 'image/png' || 
               file.type === 'image/jpeg' || 
               file.type === 'image/jpg';
    });

    if (imageFiles.length === 0) {
        alert('Nenhum ficheiro de imagem válido seleccionado. Por favor, seleccione ficheiros PNG ou JPG.');
        return;
    }

    // Add to upload queue (avoid duplicates)
    imageFiles.forEach(file => {
        const exists = uploadQueue.some(f => f.name === file.name && f.size === file.size);
        if (!exists) {
            uploadQueue.push(file);
        }
    });

    updateUploadQueueDisplay();
}

function updateUploadQueueDisplay() {
    const fileListDiv = document.getElementById('file-list-upload');
    const fileCountSpan = document.getElementById('file-count');
    const uploadBtn = document.getElementById('upload-btn');
    const clearQueueBtn = document.getElementById('clear-queue-btn');

    fileCountSpan.textContent = uploadQueue.length;

    if (uploadQueue.length > 0) {
        fileListDiv.style.display = 'block';
        uploadBtn.style.display = 'inline-block';
        clearQueueBtn.style.display = 'inline-block';

        fileListDiv.innerHTML = uploadQueue.map((file, index) => `
            <div style="padding: 5px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <span>${file.name} (${formatFileSize(file.size)})</span>
                <button onclick="removeFromQueue(${index})" style="padding: 2px 8px; cursor: pointer;">✕</button>
            </div>
        `).join('');
    } else {
        fileListDiv.style.display = 'none';
        uploadBtn.style.display = 'none';
        clearQueueBtn.style.display = 'none';
        fileListDiv.innerHTML = '';
    }
}

function removeFromQueue(index) {
    uploadQueue.splice(index, 1);
    updateUploadQueueDisplay();
}

function clearUploadQueue() {
    uploadQueue = [];
    updateUploadQueueDisplay();
    document.getElementById('file-input').value = '';
    document.getElementById('folder-input').value = '';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function uploadFiles() {
    if (uploadQueue.length === 0) {
        alert('Nenhum ficheiro para carregar.');
        return;
    }

    const progressDiv = document.getElementById('upload-progress');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('upload-status');
    const uploadBtn = document.getElementById('upload-btn');

    progressDiv.style.display = 'block';
    uploadBtn.disabled = true;

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < uploadQueue.length; i++) {
        const file = uploadQueue[i];
        const progress = ((i + 1) / uploadQueue.length * 100).toFixed(0);

        progressBar.style.width = progress + '%';
        progressBar.textContent = progress + '%';
        statusText.textContent = `A carregar ${i + 1} de ${uploadQueue.length}: ${file.name}`;

        try {
            await uploadSingleFile(file);
            successCount++;
        } catch (error) {
            console.error(`Erro ao carregar ${file.name}:`, error);
            failCount++;
        }
    }

    statusText.textContent = `Carregamento concluído! ${successCount} com sucesso, ${failCount} falharam.`;
    uploadBtn.disabled = false;

    // Clear queue and refresh document list after successful upload
    setTimeout(() => {
        clearUploadQueue();
        loadDocumentsList();
        progressDiv.style.display = 'none';
    }, 2000);
}

async function uploadSingleFile(file) {
    const formData = new FormData();
    
    // Extract filename without extension and save to source_images with .png extension
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    
    // Create a new file with .png extension
    const newFile = new File([file], baseName + '.png', { type: 'image/png' });
    formData.append('file', newFile);

    const response = await fetch('/upload_source_image', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function loadDocumentsList() {
    try {
        const response = await fetch('/list_source_images');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const documents = await response.json();
        displayDocuments(documents);
    } catch (error) {
        console.error('Erro ao carregar lista de documentos:', error);
    }
}

function displayDocuments(documents) {
    const tbody = document.getElementById('documents-table-body');
    
    if (documents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Nenhum documento encontrado</td></tr>';
        return;
    }

    // Sort documents by ID
    documents.sort((a, b) => a.id.localeCompare(b.id));

    tbody.innerHTML = documents.map(doc => `
        <tr data-filename="${doc.id}">
            <td style="padding: 10px; border: 1px solid #ddd;">${doc.id}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">
                ${doc.has_document ? '✓' : '—'}
            </td>
            <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">
                ${doc.has_table ? '✓' : '—'}
            </td>
            <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">
                ${doc.has_transcript ? '✓' : '—'}
            </td>
            <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">
                ${doc.complete ? '✓' : '—'}
            </td>
        </tr>
    `).join('');
}

function filterDocuments(filterText) {
    const rows = document.querySelectorAll('#documents-table-body tr');
    const filter = filterText.toLowerCase();

    rows.forEach(row => {
        const filename = row.getAttribute('data-filename');
        if (filename && filename.toLowerCase().includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Initialize when DOM is ready
let uploadTabInitialized = false;

// Override initUploadTab to prevent multiple initializations
const originalInitUploadTab = initUploadTab;
initUploadTab = function() {
    if (uploadTabInitialized) {
        // Just refresh the documents list if already initialized
        loadDocumentsList();
        return;
    }
    uploadTabInitialized = true;
    originalInitUploadTab();
};
