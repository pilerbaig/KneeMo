// Replace with your Google Sheets API key and spreadsheet ID
const API_KEY = 'AIzaSyD_8IZdviAY2_TXEikBMW9fsc5fyTduvdI';
const SPREADSHEET_ID = '1-i7rr6RLaqwMRTvryLOcdTMXluNGCKgQJQITrA7wdck';
const SHEET_NAME_SESSNIONS = 'sessions';
const SHEET_NAME_PATIENTS = 'patients';

function fetchHomeSessionsData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME_SESSIONS}?key=${API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayHomeSessions(data.values);
        })
        .catch(error => console.error('Error fetching data:', error));
}

function displayHomeSessions(rows) {
    const sessionDataDiv = document.getElementById('session-data');
    sessionDataDiv.innerHTML = ''; // Clear any existing content

    // Skip the header row
    const exercisesByDate = rows.slice(1).reduce((acc, row) => {
        const [id, date, exercise, rep_count, total_count, pain_level, comments] = row;

        // Group exercises by date
        if (!acc[date]) acc[date] = [];
        acc[date].push({ id, exercise, rep_count, total_count, pain_level, comments });

        return acc;
    }, {});

    // Create a container for each date and its exercises
    for (const date in exercisesByDate) {
        const dateContainer = document.createElement('div');
        dateContainer.classList.add('date-container');

        const dateHeader = document.createElement('h2');
        dateHeader.innerText = `Date: ${date}`;
        dateContainer.appendChild(dateHeader);

        exercisesByDate[date].forEach(exerciseData => {
            const exerciseContainer = document.createElement('div');
            exerciseContainer.classList.add('exercise-container');

            // Add exercise details
            exerciseContainer.innerHTML = `
                <p><strong>Exercise:</strong> ${exerciseData.exercise}</p>
                <p><strong>Reps:</strong> ${exerciseData.rep_count}</p>
                <p><strong>Total Count:</strong> ${exerciseData.total_count}</p>
                <p><strong>Pain Level:</strong> ${exerciseData.pain_level}</p>
                <p><strong>Comments:</strong> ${exerciseData.comments || ''}</p>
            `;
            dateContainer.appendChild(exerciseContainer);
        });

        sessionDataDiv.appendChild(dateContainer);
    }
}

// Call the function when the page loads
if (window.location.pathname.includes('home_sessions.html')) {
    window.onload = fetchHomeSessionsData;
}

function navigateTo(page) {
    window.location.href = page;
}


// Navigate to the specified page
function navigateTo(page) {
    window.location.href = page;
}

// Placeholder for buttons with future functionality
function showComingSoon() {
    alert("This feature is coming soon!");
}


// Fetch and populate patient data
function fetchPatients() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME_PATIENTS}?key=${API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const patientSelect = document.getElementById('patient-select');
            data.values.slice(1).forEach(row => { // Skip header
                const option = document.createElement('option');
                option.value = row[0]; // Patient ID
                option.textContent = row[1]; // Patient Name
                patientSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching patient data:', error));
}

// Store the selected patient ID in localStorage
function setSelectedPatient() {
    const patientSelect = document.getElementById('patient-select');
    const selectedPatientID = patientSelect.value;
    localStorage.setItem('selectedPatientID', selectedPatientID);
}

// Fetch patients when the index page loads
if (window.location.pathname.includes('index.html')) {
    window.onload = fetchPatients;
}
