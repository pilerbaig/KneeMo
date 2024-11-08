let patientExercises = {}; // Stores exercises for each patient
let currentPatientId = '';
// Replace with your Google Sheets API key and spreadsheet ID
const API_KEY = 'AIzaSyD_8IZdviAY2_TXEikBMW9fsc5fyTduvdI';
const SPREADSHEET_ID = '1-i7rr6RLaqwMRTvryLOcdTMXluNGCKgQJQITrA7wdck';
const SHEET_NAME_SESSIONS = 'sessions';
const SHEET_NAME_PATIENTS = 'patients';

// Fetch and display Home Sessions data
function fetchHomeSessionsData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME_SESSIONS}?key=${API_KEY}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.values && data.values.length > 1) {
                displayHomeSessions(data.values);
            } else {
                displayNoDataMessage();
            }
        })
        .catch(error => console.error('Error fetching sessions data:', error));
}

function displayHomeSessions(rows) {
    const sessionDataDiv = document.getElementById('session-data');
    sessionDataDiv.innerHTML = ''; // Clear any existing content

    const exercisesByDate = rows.slice(1).reduce((acc, row) => {
        const [id, date, exercise, rep_count, total_count, pain_level, comments] = row;

        if (!acc[date]) acc[date] = [];
        acc[date].push({ id, exercise, rep_count, total_count, pain_level, comments });
        return acc;
    }, {});

    // Display sessions grouped by date
    for (const date in exercisesByDate) {
        const dateContainer = document.createElement('div');
        dateContainer.classList.add('date-container');

        const dateHeader = document.createElement('h2');
        dateHeader.textContent = `Date: ${date}`;
        dateContainer.appendChild(dateHeader);

        exercisesByDate[date].forEach(exerciseData => {
            const exerciseContainer = document.createElement('div');
            exerciseContainer.classList.add('exercise-container');

            exerciseContainer.innerHTML = `
                <p><strong>Exercise:</strong> ${exerciseData.exercise}</p>
                <p><strong>Reps:</strong> ${exerciseData.rep_count}</p>
                <p><strong>Total Count:</strong> ${exerciseData.total_count}</p>
                <p><strong>Pain Level:</strong> ${exerciseData.pain_level}</p>
                <p><strong>Comments:</strong> ${exerciseData.comments || 'No comments'}</p>
            `;
            dateContainer.appendChild(exerciseContainer);
        });

        sessionDataDiv.appendChild(dateContainer);
    }
}

function displayNoDataMessage() {
    const sessionDataDiv = document.getElementById('session-data');
    sessionDataDiv.innerHTML = '<p>No session data available.</p>';
}

// Fetch patient data and populate dropdown
function fetchPatients() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME_PATIENTS}?key=${API_KEY}`;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.values && data.values.length > 1) {
                populatePatientSelect(data.values);
            } else {
                console.warn('No patients found.');
            }
        })
        .catch(error => console.error('Error fetching patient data:', error));
}

function populatePatientSelect(rows) {
    const patientSelect = document.getElementById('patient-select');
    patientSelect.innerHTML = '<option value="">--Choose a Patient--</option>';

    rows.slice(1).forEach(row => { // Skip header
        const option = document.createElement('option');
        option.value = row[0]; // Patient ID
        option.textContent = row[1]; // Patient Name
        patientSelect.appendChild(option);
    });
}

// Store selected patient ID
function setSelectedPatient() {
    const patientSelect = document.getElementById('patient-select');
    const selectedPatientID = patientSelect.value;
    localStorage.setItem('selectedPatientID', selectedPatientID);
}

// Utility function for navigation
function navigateTo(page) {
    window.location.href = page;
}

// Show coming soon alert
function showComingSoon() {
    alert("This feature is coming soon!");
}

// Load functions based on current page
window.onload = function() {
    const currentPage = window.location.pathname;

    if (currentPage.includes('home_sessions.html')) {
        fetchHomeSessionsData();
    } else if (currentPage.includes('index.html')) {
        fetchPatients();
    }
};
document.addEventListener('DOMContentLoaded', function () {
    const addExerciseButton = document.querySelector('.add-exercise');
    const newExerciseContainer = document.getElementById('new-exercise-container');
    const newExerciseInput = document.getElementById('new-exercise-input');
    const newRepsInput = document.getElementById('new-reps-input');
    const saveExerciseButton = document.getElementById('save-exercise');
    const cancelExerciseButton = document.getElementById('cancel-exercise');
    const exerciseButtonsContainer = document.querySelector('.exercise-buttons');

    // Show input fields when "Add Exercise" is clicked
    addExerciseButton.addEventListener('click', function () {
        newExerciseContainer.style.display = 'block'; // Show input fields
        addExerciseButton.style.display = 'none';    // Hide the "Add Exercise" button
    });

    // Save new exercise when "Save Exercise" is clicked
    saveExerciseButton.addEventListener('click', function () {
        const newExercise = newExerciseInput.value.trim();
        const newReps = newRepsInput.value.trim();

        if (newExercise && newReps) {
            const newButton = document.createElement('button');
            newButton.textContent = `${newExercise} (${newReps} reps)`;

            // Create a Remove button
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.classList.add('remove-exercise');

            // Add event listener to remove button
            removeButton.addEventListener('click', function () {
                exerciseButtonsContainer.removeChild(newButton);
                exerciseButtonsContainer.removeChild(removeButton);
            });

            // Append both exercise and remove buttons to the container
            exerciseButtonsContainer.appendChild(newButton);
            exerciseButtonsContainer.appendChild(removeButton);
        }

        // Clear input and hide the form
        newExerciseInput.value = '';
        newRepsInput.value = '';
        newExerciseContainer.style.display = 'none';
        addExerciseButton.style.display = 'block'; // Show "Add Exercise" button again
    });

    // Cancel adding new exercise
    cancelExerciseButton.addEventListener('click', function () {
        newExerciseInput.value = '';
        newRepsInput.value = '';
        newExerciseContainer.style.display = 'none';
        addExerciseButton.style.display = 'block'; // Show "Add Exercise" button again
    });
});

// Function to navigate to other pages
function navigateTo(page) {
    window.location.href = page;
}

document.addEventListener('DOMContentLoaded', function () {
    const patientSelect = document.getElementById('patient-select');
    const exerciseButtonsContainer = document.querySelector('.exercise-buttons');
    const newExerciseContainer = document.getElementById('new-exercise-container');
    const newExerciseInput = document.getElementById('new-exercise-input');
    const newRepsInput = document.getElementById('new-reps-input');
    const saveExerciseButton = document.getElementById('save-exercise');
    const cancelExerciseButton = document.getElementById('cancel-exercise');
    const saveButton = document.querySelector('footer button'); // Save button in the footer

    // Load patient data when the page loads
    fetchPatients();

    let currentPatientId = null; // Track the currently selected patient
    let patientExercises = {}; // Store exercises by patient ID

    // Function to fetch patient data from Google Sheets
    function fetchPatients() {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME_PATIENTS}?key=${API_KEY}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const patientSelect = document.getElementById('patient-select');
                data.values.slice(1).forEach(row => {
                    const option = document.createElement('option');
                    option.value = row[0]; // Patient ID
                    option.textContent = row[1]; // Patient Name
                    patientSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error fetching patient data:', error));
    }

    // When a patient is selected, load their exercises
    patientSelect.addEventListener('change', function () {
        currentPatientId = patientSelect.value;
        loadExercisesForPatient(currentPatientId);
    });

    // Load exercises for the currently selected patient
    function loadExercisesForPatient(patientId) {
        if (patientExercises[patientId]) {
            // Clear the exercise container before adding new exercises
            exerciseButtonsContainer.innerHTML = '';

            patientExercises[patientId].forEach(exercise => {
                const newButton = document.createElement('button');
                newButton.textContent = `${exercise.name} (${exercise.reps} reps)`;

                // Create a Remove button
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.classList.add('remove-exercise');

                // Add event listener to remove button
                removeButton.addEventListener('click', function () {
                    removeExerciseFromPatient(patientId, exercise.name);
                });

                // Append both exercise and remove buttons to the container
                exerciseButtonsContainer.appendChild(newButton);
                exerciseButtonsContainer.appendChild(removeButton);
            });
        }
    }

    // Show the "Add Exercise" form
    function showAddExerciseForm() {
        newExerciseContainer.style.display = 'block';
    }

    // Save new exercise when "Save Exercise" is clicked
    saveExerciseButton.addEventListener('click', function () {
        const newExercise = newExerciseInput.value.trim();
        const newReps = newRepsInput.value.trim();
    
        if (newExercise && newReps && currentPatientId) {
            // If the patient doesn't already have an exercise list, initialize it
            if (!patientExercises[currentPatientId]) {
                patientExercises[currentPatientId] = [];
            }
    
            // Add new exercise to the patient's list
            patientExercises[currentPatientId].push({ name: newExercise, reps: newReps });
    
            // Update the UI to show the new exercise
            loadExercisesForPatient(currentPatientId);
    
            // Save the new exercise to Google Sheets
            saveExerciseToSheet(currentPatientId, newExercise, newReps);  // Call to save the exercise
    
            // Clear input and hide the form
            newExerciseInput.value = '';
            newRepsInput.value = '';
            newExerciseContainer.style.display = 'none';
        } else {
            alert('Please enter both exercise name and rep count.');
        }
    });
    

    // Remove an exercise from a patient's list
    function removeExerciseFromPatient(patientId, exerciseName) {
        patientExercises[patientId] = patientExercises[patientId].filter(exercise => exercise.name !== exerciseName);
        loadExercisesForPatient(patientId);
    }

    // Save exercises for the current patient when "Save" button is pressed
    saveButton.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent the default action (form submission or page navigation)
    
        if (currentPatientId) {
            // Save the patient's exercises to localStorage or backend
            localStorage.setItem('patientExercises', JSON.stringify(patientExercises));
    
            // Optionally, you can alert the user that the exercises were saved successfully
            alert('Exercises saved!');
            
            // If you want to prevent the navigation, you can choose to stay on the current page instead of redirecting to the index
            // If you still want to navigate after saving, then you can use:
            // window.location.href = 'index.html'; // (or whichever page you want to navigate to after saving)
        } else {
            alert('Please select a patient before saving!');
        }
    });
    
});
function saveExerciseToSheet(patientId, exercise, reps) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME_SESSIONS}!A1:append?valueInputOption=RAW&key=${API_KEY}`;
    
    const newExerciseData = {
        "values": [
            [patientId, new Date().toLocaleDateString(), exercise, reps, '', '', ''] // Adjust the columns based on your sheet structure
        ]
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExerciseData),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Exercise added successfully:', data);
        fetchHomeSessionsData(); // Refresh the home session data
    })
    .catch(error => {
        console.error('Error saving exercise:', error);
    });
}

saveExerciseButton.addEventListener('click', function () {
    const newExercise = newExerciseInput.value.trim();
    const newReps = newRepsInput.value.trim();

    if (newExercise && newReps && currentPatientId) {
        // Save the exercise to Google Sheets
        saveExerciseToSheet(currentPatientId, newExercise, newReps);
        
        // Clear the input fields and UI
        newExerciseInput.value = '';
        newRepsInput.value = '';
        newExerciseContainer.style.display = 'none';
        addExerciseButton.style.display = 'block'; // Show "Add Exercise" button again
    } else {
        alert('Please enter both exercise name and rep count.');
    }
});

function saveExerciseToSheet(patientId, exercise, reps) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME_SESSIONS}!A1:append?valueInputOption=RAW&key=${API_KEY}`;
    
    const newExerciseData = {
        "values": [
            [patientId, new Date().toLocaleDateString(), exercise, reps, '', '', ''] // Adjust the columns based on your sheet structure
        ]
    };
    
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newExerciseData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Exercise saved:', data);
    })
    .catch(error => {
        console.error('Error saving exercise to sheet:', error);
    });
}