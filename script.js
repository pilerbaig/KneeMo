const API_KEY = 'AIzaSyD_8IZdviAY2_TXEikBMW9fsc5fyTduvdI';
const SPREADSHEET_ID = '1-i7rr6RLaqwMRTvryLOcdTMXluNGCKgQJQITrA7wdck';
const SHEET_NAME_SESSIONS = 'sessions';
const SHEET_NAME_PATIENTS = 'patients';
const SHEET_NAME_EXERCISES = 'exercises';

let currentPatientId = '';
let patientExercises = {};

document.addEventListener('DOMContentLoaded', () => {
    // Identify the current page and load the appropriate data
    const page = window.location.pathname;
    if (page.includes('index.html')) fetchPatients();
    if (page.includes('exercises.html')) {
        // Initialize the page and load exercises for the selected patient
        initializeExercisePage();
        fetchData(SHEET_NAME_EXERCISES, displayExercises);
    }
    if (page.includes('home_sessions.html')) fetchData(SHEET_NAME_SESSIONS, displayHomeSessions);

    // Common page navigation function
    window.navigateTo = (page) => window.location.href = page;
});

// Fetch data from Google Sheets for a specified sheet
function fetchData(sheetName, callback) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${API_KEY}`;
    fetch(url)
        .then(response => response.json())
        .then(data => callback(data.values || []))
        .catch(error => console.error(`Error fetching ${sheetName} data:`, error));
}

// Fetch and populate the patient dropdown
function fetchPatients() {
    fetchData(SHEET_NAME_PATIENTS, populatePatientSelect);
}

// Populate the patient dropdown
function populatePatientSelect(rows) {
    const patientSelect = document.getElementById('patient-select');
    rows.slice(1).forEach(row => {
        const option = document.createElement('option');
        option.value = row[0];
        option.textContent = row[1];
        patientSelect.appendChild(option);
    });
    patientSelect.addEventListener('change', () => {
        currentPatientId = patientSelect.value;
        localStorage.setItem('selectedPatientID', currentPatientId);
        loadExercisesForPatient(currentPatientId);
    });
}

function displayExercises(rows) {
    const patientId = localStorage.getItem('selectedPatientID'); // Retrieve patient ID from localStorage
    if (!patientId) {
        alert("Please select a patient on the dashboard first.");
        return;
    }

    const exerciseButtonsContainer = document.querySelector('.exercise-buttons');
    exerciseButtonsContainer.innerHTML = '';

    // Filter rows to include only exercises for the current patient
    const patientExercises = rows.filter(row => row[0] === patientId);

    patientExercises.forEach(row => {
        const [id, exercise, reps] = row;

        // Create a unique identifier for each exercise entry
        const exerciseId = `${patientId}-${exercise}`;

        // Create a container for each exercise entry
        const exerciseContainer = document.createElement('div');
        exerciseContainer.classList.add('exercise-entry');
        exerciseContainer.setAttribute('id', exerciseId); // Set unique ID for removal

        const exerciseButton = document.createElement('button');
        exerciseButton.textContent = `${exercise} (${reps} reps)`;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.classList.add('remove-exercise');

        // Attach the click event to remove the exercise from UI and Google Sheets
        removeButton.addEventListener('click', () => {
            removeExerciseFromPatient(patientId, exercise);
            document.getElementById(exerciseId).remove(); // Remove the exercise container from the UI
        });

        exerciseContainer.appendChild(exerciseButton);
        exerciseContainer.appendChild(removeButton);
        exerciseButtonsContainer.appendChild(exerciseContainer);
    });
}


// Initialize the Exercises page with required event listeners
function initializeExercisePage() {
    currentPatientId = localStorage.getItem('selectedPatientID'); // Retrieve from localStorage

    if (!currentPatientId) {
        alert("Please select a patient on the dashboard first.");
        return;
    }

    const addExerciseButton = document.querySelector('.add-exercise');
    const newExerciseContainer = document.getElementById('new-exercise-container');
    const exerciseDropdown = document.getElementById('exercise-dropdown');  // Dropdown for exercise selection
    const newRepsInput = document.getElementById('new-reps-input');
    const saveExerciseButton = document.getElementById('save-exercise');
    const cancelExerciseButton = document.getElementById('cancel-exercise');

    addExerciseButton.addEventListener('click', () => {
        newExerciseContainer.style.display = 'block';
        addExerciseButton.style.display = 'none';
    });

    cancelExerciseButton.addEventListener('click', resetExerciseForm);
    saveExerciseButton.addEventListener('click', () => {
        const selectedExercise = exerciseDropdown.value;
        const newReps = newRepsInput.value.trim();
        if (selectedExercise && newReps && currentPatientId) {
            addExerciseToPatient(currentPatientId, selectedExercise, newReps);
            saveExerciseToSheet(currentPatientId, selectedExercise, newReps);
            resetExerciseForm();
        } else {
            alert('Please select an exercise and enter a rep count.');
        }
    });
}

// Reset the exercise input form
function resetExerciseForm() {
    const newExerciseContainer = document.getElementById('new-exercise-container');
    document.getElementById('exercise-dropdown').value = '';  // Reset dropdown
    document.getElementById('new-reps-input').value = '';
    newExerciseContainer.style.display = 'none';
    document.querySelector('.add-exercise').style.display = 'block';
}

// Display exercises for the selected patient
function loadExercisesForPatient(patientId) {
    const exerciseButtonsContainer = document.querySelector('.exercise-buttons');
    if (!exerciseButtonsContainer) {
        console.error("The element '.exercise-buttons' was not found.");
        return;
    }

    exerciseButtonsContainer.innerHTML = '';
    (patientExercises[patientId] || []).forEach(exercise => {
        const exerciseButton = document.createElement('button');
        exerciseButton.textContent = `${exercise.name} (${exercise.reps} reps)`;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.classList.add('remove-exercise');
        removeButton.addEventListener('click', () => removeExerciseFromPatient(patientId, exercise.name));

        exerciseButtonsContainer.appendChild(exerciseButton);
        exerciseButtonsContainer.appendChild(removeButton);
    });
}


// Add exercise to patient data and update UI
function addExerciseToPatient(patientId, name, reps) {
    if (!patientExercises[patientId]) patientExercises[patientId] = [];

    // Add the new exercise to patientExercises
    patientExercises[patientId].push({ name, reps });

    // Add the new exercise to the UI directly
    const exerciseButtonsContainer = document.querySelector('.exercise-buttons');
    const exerciseContainer = document.createElement('div');
    exerciseContainer.classList.add('exercise-entry');

    const exerciseButton = document.createElement('button');
    exerciseButton.textContent = `${name} (${reps} reps)`;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.classList.add('remove-exercise');
    removeButton.addEventListener('click', () => {
        removeExerciseFromPatient(patientId, name);
        exerciseButtonsContainer.removeChild(exerciseContainer); // Remove from UI
    });

    exerciseContainer.appendChild(exerciseButton);
    exerciseContainer.appendChild(removeButton);
    exerciseButtonsContainer.appendChild(exerciseContainer);
}

// Remove exercise from a patient's data
function removeExerciseFromPatient(patientId, exerciseName) {
    // Remove the exercise from the local patientExercises data
    patientExercises[patientId] = (patientExercises[patientId] || []).filter(exercise => exercise.name !== exerciseName);

    // Remove the exercise from Google Sheets
    removeExerciseFromSheet(patientId, exerciseName);

}

// Reset the exercise input form
function resetExerciseForm() {
    const newExerciseContainer = document.getElementById('new-exercise-container');
    document.getElementById('new-exercise-input').value = '';
    document.getElementById('new-reps-input').value = '';
    newExerciseContainer.style.display = 'none';
    document.querySelector('.add-exercise').style.display = 'block';
}

// Display Home Sessions data grouped by date
function displayHomeSessions(rows) {
    const sessionDataDiv = document.getElementById('session-data');
    sessionDataDiv.innerHTML = '';  // Clear previous content

    // Retrieve the selected patient ID from localStorage
    const currentPatientId = localStorage.getItem('selectedPatientID');
    if (!currentPatientId) {
        alert("Please select a patient on the dashboard first.");
        return;
    }

    // Skip header row, filter sessions by patient ID, and group sessions by date
    const sessionsByDate = rows.slice(1).reduce((acc, row) => {
        const [id, session, date, exercise, count, total_count, pain_level, pain_location, comments] = row;

        // Only process rows that match the current patient ID
        if (id === currentPatientId) {
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push({
                exercise,
                count,
                total_count,
                pain_level: pain_level || 'Not specified',  // Default to "Not specified" if empty
                pain_location: pain_location || 'Not specified',  // Default to "Not specified" if empty
                comments
            });
        }
        return acc;
    }, {});

    // Generate HTML for each date's sessions
    for (const date in sessionsByDate) {
        const dateContainer = document.createElement('div');
        dateContainer.classList.add('date-container');

        // Add a header for the date
        const dateHeader = document.createElement('h2');
        dateHeader.textContent = `Date: ${date}`;
        dateContainer.appendChild(dateHeader);

        // Add each exercise session under the date
        sessionsByDate[date].forEach(session => {
            const exerciseContainer = document.createElement('div');
            exerciseContainer.classList.add('exercise-container');

            exerciseContainer.innerHTML = `
                <p><strong>Exercise:</strong> ${session.exercise}</p>
                <p><strong>Count:</strong> ${session.count}</p>
                <p><strong>Total Count:</strong> ${session.total_count}</p>
                <p><strong>Pain Level:</strong> ${session.pain_level}</p>
                <p><strong>Pain Location:</strong> ${session.pain_location}</p>
                <p><strong>Comments:</strong> ${session.comments || 'No comments'}</p>
            `;
            dateContainer.appendChild(exerciseContainer);
        });

        sessionDataDiv.appendChild(dateContainer);
    }
}

// Save new exercise data to Google Sheets
function saveExerciseToSheet(patientId, exercise, reps) {
    const webAppUrl = 'https://script.google.com/macros/s/AKfycbxfI3i3wxXoL46dnzDfTYFNitvLLuyQpscY4GGowAALUIuYnJVsoxLzAD1ol-iXG3olgg/exec'

    const newExerciseData = {
        patientId: patientId,
        exercise: exercise,
        reps: reps

    };

    fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExerciseData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
            }
            return response.text();
        })
        .then(data => console.log('Exercise added successfully:', data))
        .catch(error => console.error('Error saving exercise:', error));
}

function removeExerciseFromSheet(patientId, exerciseName) {
    const webAppUrl = 'https://script.google.com/macros/s/AKfycbyQdlqlk5dWLakwbDk5nA-lEbGNoyuSdGm0npqQ6j7qZ_v54VLAjAHvzYdsboTku3j4ow/exec'


    const exerciseData = {
        patientId: patientId,
        exercise: exerciseName //String(exerciseName),
    };

    console.log(patientId);
    console.log(exerciseName);

    fetch(webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
            }
            return response.text();
        })
        .then(data => console.log('Exercise removed successfully:', data))
        .catch(error => console.error('Error removing exercise:', error));
}
