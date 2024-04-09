function init_document() {
    const districtInput = document.getElementById('document-district');
    const collectDateInput = document.getElementById('document-collection-date');
    const sprayYearInput = document.getElementById('document-year-sprayed');
    const doctypeInput = document.getElementById('document-type');
    const docSubmitButton = document.getElementById('document-submit-btn');
    
    function initialize() {
        attachEventListeners();
    }

    function attachEventListeners() {
        docSubmitButton.addEventListener('click', handleDocumentSubmit);
    }

    // Handle transcription input and navigation
    async function handleDocumentSubmit(e) {
        const submission = {
          'file_id': current_file,
          'district': districtInput.value,
          'collect_date': collectDateInput.value,
          'spray_year': sprayYearInput.value,
          'doctype': doctypeInput.value
        }

        const response = await fetch('http://localhost:5000/submit_document', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submission)
        });

        if (!response.ok) {
            console.error(`Failed to fetch transcription: ${response.statusText}`);
            return;
        }

        console.log(response);
        
        setTab('transcription');
    }

    initialize();
}

window.addEventListener('load', (event) => {
  init_document();
});
