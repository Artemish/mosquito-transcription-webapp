let document_tab = {};

function init_document() {
    const provinceInput = document.getElementById('document-province');
    const collectDateInput = document.getElementById('document-collection-date');
    const sprayYearInput = document.getElementById('document-year-sprayed');
    const doctypeInput = document.getElementById('document-type');
    const docSubmitButton = document.getElementById('document-submit-btn');

    const districtInput = document.getElementById('document-district-city');
    const locality1 = document.getElementById('document-locality-1');
    const neighborhood1 = document.getElementById('document-neighborhood-1');
    const locality2 = document.getElementById('document-locality-2');
    const neighborhood2 = document.getElementById('document-neighborhood-2');

    const imageDisplay = document.getElementById('document-image-display');
    
    function initialize() {
        attachEventListeners();
        document_tab = {
          reset: reset
        };
    }

    function reset() {
      imageDisplay.src = "";
      provinceInput.value = "";
      collectDateInput.value = "";
      sprayYearInput.value = "";
      doctypeInput.value = "";
      districtInput.value = "";
      locality1.value = "";
      neighborhood1.value = "";
      locality2.value = "";
      neighborhood2.value = "";
    }


    function attachEventListeners() {
        docSubmitButton.addEventListener('click', handleDocumentSubmit);
    }

    // Handle transcription input and navigation
    async function handleDocumentSubmit(e) {
        const submission = {
          'file_id': current_file,
          'province': provinceInput.value,
          'district_city': districtInput.value,
          'locality1': locality1.value,
          'neighborhood1': neighborhood1.value,
          'locality2': locality2.value,
          'neighborhood2': neighborhood2.value,
          'collect_date': collectDateInput.value,
          'spray_year': sprayYearInput.value,
          'doctype': doctypeInput.value
        }

        const response = await fetch('submit_document', {
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
        
        fetchAndDisplayImage(current_file, target="dewarp"); 
        setTab('dewarp');
    }

    initialize();
}

async function fetchDocument(file) {
    const response = await fetch(`document/${file.id}`);

    const provinceInput = document.getElementById('document-province');
    const collectDateInput = document.getElementById('document-collection-date');
    const sprayYearInput = document.getElementById('document-year-sprayed');
    const doctypeInput = document.getElementById('document-type');
    const docSubmitButton = document.getElementById('document-submit-btn');

    const districtInput = document.getElementById('document-district-city');
    const locality1 = document.getElementById('document-locality-1');
    const neighborhood1 = document.getElementById('document-neighborhood-1');
    const locality2 = document.getElementById('document-locality-2');
    const neighborhood2 = document.getElementById('document-neighborhood-2');

    if (!response.ok) {
        console.error(`Failed to fetch document: ${response.statusText}`);
        return;
    }

    const doc = await response.json();
    console.log("Fetched document:");
    console.log(doc);

    provinceInput.value = doc?.province || "";
    collectDateInput.value = doc?.collect_date || "";
    sprayYearInput.value = doc?.spray_year || "";
    doctypeInput.value = doc?.doctype || "";
    districtInput.value = doc?.locality1 || "";
    locality1.value = doc?.locality1 || "";
    neighborhood1.value = doc?.neighborhood1 || "";
    locality2.value = doc?.locality2 || "";
    neighborhood2.value = doc?.neighborhood2 || "";

    setCurrentHeader(doctypeInput.value);
}

function updateProvince() {
    const districtDatalist = document.getElementById('districts-cities');
    const districtInput = document.getElementById('document-district-city');
    const provinceSelect = document.getElementById('document-province');
    
    // Get the selected district option
    const selectedDistrict = districtDatalist.options.namedItem(districtInput.value);
    if (selectedDistrict) {
      const province = selectedDistrict.getAttribute('data-province');
      
      // Clear the province dropdown
      provinceSelect.value = province;
    }
}

function updateHeader() {
    const headerSelect = document.getElementById('document-type');
    const selectedHeader = headerSelect.options[headerSelect.selectedIndex];
    setCurrentHeader(selectedHeader.value);
}

window.addEventListener('load', (event) => {
  init_document();
});
