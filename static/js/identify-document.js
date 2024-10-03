// Get elements
var identify_document = null;

function init_identify_document() {
  const modal = document.getElementById('myModal');
  const modalContent = document.getElementById('modalContent');
  const identifyBtn = document.getElementById('identifyBtn');

  // Questions and answers logic
  const questions = [
      { // Question 1, baseline
        question: "Identify some of the keywords in the title of the document:",
          options: [
              { text: 'Armadilhas de Luz (Light traps)', next: 'light_traps_indoor_outdoor' },
              { text: 'Anopheles Funestus', next: 2 },
              { text: 'Anopheles Gambiae s.l.', next: 3 },
              { text: 'Outros Anopheles', next: 4 },
              { text: 'Outros Doencas (Other disease vectors)', next: 5 }
          ]
      },
      { // Question 2, funestus
          question: "How many rows does this document have?",
          options: [
              { text: '10', next: 'anopheles_funestus' },
              { text: '15', next: 'anopheles_funestus_s.1_compact' },
          ]
      },
      { // Question 3, gambiae
          question: "How many rows does this document have?",
          options: [
              { text: '10', next: 'anopheles_gambia_s.1' },
              { text: '15', next: 'anopheles_gambia_s.1_compact' },
          ]
      },
      { // Question 4, outros anopheles
          question: "TODO identify outros anopheles documents?",
          options: [
              { text: 'return', next: 1 },
              { text: '15', next: 'anopheles_gambia_s.1_compact' },
          ]
      },
      { // Question 5, other disease vectors
          question: "What kind of net data is present in the document?",
          options: [
              { text: 'Simple (presenca de rede)', next: 6 },
              { text: 'Full (source, type, presence)', next: 7 },
          ]
      },
      { // Question 6, other disease vectors, simple net data
          question: "Which of the following species are recorded?",
          options: [
              { text: 'Culex/Aedes, blank', next: 'other_vectors_disease_a' },
              { text: 'Gambiae, funestus, cous/phar/macu/pretori (or 4 blank)', next: 'other_vectors_disease_d' },
          ]
      },
      { // Question 7, other disease vectors, full net data
          question: "Which of the following species are recorded?",
          options: [
              { text: '6 empty sections for Outras Especies M/F', next: 'other_vectors_disease_c' },
              { text: 'Gambiae, funestus, culex/aedes + cous/phar/macu/pretori (M/F)', next: 'other_vectors_disease_b' },
          ]
      },
  ];

  // Initial question index
  let currentQuestionIndex = 0;

  function showQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    modalContent.innerHTML = ''; // Clear the modal content

    // Create a paragraph for the question text
    const questionText = document.createElement('p');
    questionText.textContent = currentQuestion.question;
    modalContent.appendChild(questionText);

    // Create buttons for each option
    currentQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'btn btn-secondary';
        button.textContent = option.text;

        // Attach an onclick event handler directly to the button
        button.addEventListener('click', function() {
            handleOptionClick(option.next);
        });

        // Append the button to the modal content
        modalContent.appendChild(button);
    });
  }

  function showClose(result) {
    modalContent.innerHTML = ''; // Clear the modal content

    // Create a paragraph for the question text
    const completeText = document.createElement('p');
    completeText.textContent = `Document identified: ${result}`;
    modalContent.appendChild(completeText);

    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-primary';
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', closeModal);

    modalContent.appendChild(closeButton);
  }

  // Handle option click
  function handleOptionClick(next) {
      if (typeof next === 'string') {
          // Show the identified document
          setCurrentHeader(next);
          showClose(next);
      } else {
          // Move to the next question
          currentQuestionIndex = next - 1;
          showQuestion();
      }
  }

  // Open modal
  function openModal() {
      modal.style.display = 'flex';
      currentQuestionIndex = 0; // Reset to the first question
      showQuestion();
  }

  // Close modal
  function closeModal() {
      modal.style.display = 'none';
      const districtInput = document.getElementById('document-district-city');
      districtInput.focus();
  }

  function initialize() { 
    identify_document = {
      open: openModal,
      close: closeModal,
    };

    // Event listener for the button
    identifyBtn.addEventListener('click', openModal);

    // Close the modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            closeModal();
        }
    });
  };

  initialize();
}

window.addEventListener('load', (event) => {
  init_identify_document();
});
