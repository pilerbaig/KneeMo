const API_KEY = 'AIzaSyD_8IZdviAY2_TXEikBMW9fsc5fyTduvdI';
const SPREADSHEET_ID = '1-i7rr6RLaqwMRTvryLOcdTMXluNGCKgQJQITrA7wdck';
// const SHEET_NAME_SESSIONS = 'sessions_copy';
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
    if (window.location.pathname.includes('alerts.html')) {
        initializeAlertsPage();
    }
    if (page.includes('home_sessions.html')) fetchData(SHEET_NAME_SESSIONS, displayHomeSessions);
    if (page.includes('overall.html')) initializeOverallPage();
    if (document.getElementById('patient-select-header')) initializePatientDropdown();

    // Common page navigation function
    window.navigateTo = (page) => window.location.href = page;
});

// Fetch and populate the patient dropdown in the header
function initializePatientDropdown() {
    fetchData('patients', populatePatientDropdown);
}

// Populate the dropdown with patient data
function populatePatientDropdown(rows) {
    const patientDropdown = document.getElementById('patient-select-header');
    const selectedPatient = localStorage.getItem('selectedPatientID');

    // Populate the dropdown with patients
    rows.slice(1).forEach(row => {
        const [id, name] = row;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        if (id === selectedPatient) {
            option.selected = true; // Select the currently selected patient
        }
        patientDropdown.appendChild(option);
    });

    // Listen for changes in the dropdown
    patientDropdown.addEventListener('change', () => {
        const selectedPatientID = patientDropdown.value;
        localStorage.setItem('selectedPatientID', selectedPatientID);
        location.reload();
        // Optionally, trigger a reload or action when the patient is changed
        // alert(`Patient changed to ID: ${selectedPatientID}`);
    });
}

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

    // Hide the form and reset inputs when the "Cancel" button is clicked
    cancelExerciseButton.addEventListener('click', () => {
        newExerciseContainer.style.display = 'none';  // Hide the exercise input fields
        addExerciseButton.style.display = 'block';    // Show the "Add Exercise" button
        resetExerciseForm();                          // Reset the dropdown and reps input
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
        const [timestamp, id, session, exercise, count, total_count, pain_level, pain_location, comments] = row;

        // Only process rows that match the current patient ID
        if (id === currentPatientId && !(exercise == 'Complete') && !(exercise == 'ROM')) {
            if (!acc[timestamp.slice(0, 10)]) {
                acc[timestamp.slice(0, 10)] = [];
            }
            acc[timestamp.slice(0, 10)].push({
                exercise,
                count,
                total_count,
                pain_level: pain_level || 'Not specified',  // Default to "Not specified" if empty
                pain_location: pain_location || 'Not specified',  // Default to "Not specified" if empty
                comments
            });
        } else if (id === currentPatientId && (exercise == 'ROM')) {
            if (!acc[timestamp.slice(0, 10)]) {
                acc[timestamp.slice(0, 10)] = [];
            }
            acc[timestamp.slice(0, 10)].push({
                exercise,
                count,
                total_count
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

            if (!(session.exercise == 'ROM')) {
                exerciseContainer.innerHTML = `
                <p><strong>Exercise:</strong> ${session.exercise}</p>
                <p><strong>Reps:</strong> ${session.count} / ${session.total_count}</p>
                <p><strong>Pain Level:</strong> ${session.pain_level}</p>
                <p><strong>Pain Location:</strong> ${session.pain_location}</p>
                <p><strong>Comments:</strong> ${session.comments || 'No comments'}</p>
            `;
            }
            else {
                exerciseContainer.innerHTML = `
                <p><strong>Exercise:</strong> Range of Motion</p>
                <p><strong>Low ROM:</strong> ${session.count}</p>
                <p><strong>High ROM:</strong> ${session.total_count}</p>
            `;
            }
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

// Initialize the Alerts Page
function initializeAlertsPage() {
    fetchData(SHEET_NAME_SESSIONS, processAlertsData);
}

// Process the session data to identify pain and incomplete/missed days
function processAlertsData(rows) {
    const painDays = [];
    const incompleteDays = [];
    const sessionsByDate = {};
    const currentPatientId = localStorage.getItem('selectedPatientID');

    // Organize sessions by date and ID
    rows.slice(1).forEach(row => {
        const [timestamp, id, sessionDate, exercise, count, totalCount, painRating, painLocation, comments] = row;
        const date = timestamp.slice(0, 10);  // Extract the date part from the timestamp (YYYY-MM-DD)

        if (!sessionsByDate[date]) {
            sessionsByDate[date] = [];
        }
        if (id == currentPatientId) {
            sessionsByDate[date].push({ exercise, count, painRating: parseInt(painRating) || 0 });
        }
    });

    // Check each date for pain and completion status
    Object.keys(sessionsByDate).forEach(date => {
        const exercises = sessionsByDate[date];
        let hasPain = false;
        let hasComplete = false;
        let painDayEntry = [];

        exercises.forEach(exercise => {
            // Identify pain days: exercises with pain level >= 4
            if (exercise.painRating >= 4) {
                hasPain = true;
                painDayEntry.push(`${exercise.exercise} (Pain: ${exercise.painRating})`);
            }
            // Check if exercise is marked as "complete"
            if (exercise.exercise.toLowerCase() === "complete") {
                hasComplete = true;
            }
        });

        // Record pain days
        if (hasPain) {
            painDays.push({ date, exercises: painDayEntry });
        }

        // Record incomplete or missed days
        if (!hasComplete) {
            if (exercises.length == 0) {
                incompleteDays.push({ date, status: "Missed" });
            } else {
                incompleteDays.push({ date, status: "Incomplete" });
            }
        }
    });

    // Display alerts on the page
    displayAlerts(painDays, incompleteDays);
}

// Display the alerts for pain days and incomplete/missed days
function displayAlerts(painDays, incompleteDays) {
    const painDaysList = document.getElementById('pain-days-list');
    const incompleteDaysList = document.getElementById('incomplete-days-list');

    painDaysList.innerHTML = ''; // Clear existing content
    incompleteDaysList.innerHTML = ''; // Clear existing content

    // Display pain days with styled containers
    painDays.forEach(entry => {
        const painContainer = document.createElement('div');
        painContainer.classList.add('alert-container');

        painContainer.innerHTML = `
            <h3>Date: ${entry.date}</h3>
            <p><strong>Exercises:</strong> ${entry.exercises.join(', ')}</p>
        `;

        painDaysList.appendChild(painContainer);
    });

    // Display incomplete/missed days with styled containers
    incompleteDays.forEach(entry => {
        const incompleteContainer = document.createElement('div');
        incompleteContainer.classList.add('alert-container');

        incompleteContainer.innerHTML = `
            <h3>Date: ${entry.date}</h3>
            <p><strong>Status:</strong> ${entry.status}</p>
        `;

        incompleteDaysList.appendChild(incompleteContainer);
    });
}

// Initialize the Overall Page
function initializeOverallPage() {
    fetchData(SHEET_NAME_SESSIONS, processROMData);
}

// Process ROM data for the past week
function processROMData(rows) {
    const currentPatientId = localStorage.getItem('selectedPatientID');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const romData = [];

    rows.slice(1).forEach(row => {
        const [timestamp, id, session, exercise, count, totalCount] = row;
        const date = new Date(timestamp);

        if (
            id == currentPatientId &&
            exercise == "ROM" &&
            date >= oneWeekAgo
        ) {
            romData.push({
                date: date.toLocaleDateString(),
                lowROM: parseFloat(count),
                highROM: parseFloat(totalCount)
            });
        }
    });

    displayROMChart(romData);
}

// Display the ROM chart
function displayROMChart(romData) {
    const ctx = document.getElementById('romChart').getContext('2d');

    const dates = romData.map(data => data.date);
    const lowROMValues = romData.map(data => data.lowROM);
    const highROMValues = romData.map(data => data.highROM);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Low ROM',
                    data: lowROMValues,
                    // borderColor: 'rgba(228, 178, 0, 0.8)',
                    backgroundColor: ['rgba(228, 178, 0, 0.8)'],
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'High ROM',
                    data: highROMValues,
                    backgroundColor: ['rgba(255, 236, 0, 1)'],
                    fill: false,
                    tension: 0.1
                },
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    stacked: true // Stack the bars on the x-axis for overlapping
                },
                y: {
                    title: {
                        display: true,
                        text: 'ROM'
                    },
                    beginAtZero: true,
                    stacked: false // Ensure values are not stacked on the y-axis
                }
            }
        }
    });
}

function switchTab(tabId) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to the clicked tab and corresponding content
    document.querySelector(`.tab[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');


}