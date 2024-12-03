function switchTab(tabId) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active class to the clicked tab and corresponding content
    document.querySelector(`.tab[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function navigateTo(page) {
    window.location.href = page;
}

function toggleMenu() {
    alert('Menu feature coming soon!');
}
