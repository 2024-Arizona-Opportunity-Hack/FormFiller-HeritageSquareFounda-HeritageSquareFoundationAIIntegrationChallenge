// src/popup.js

document.getElementById('saveButton').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    chrome.storage.local.set({ apiKey }, () => {
        // Display a status message to confirm the key has been saved
        const status = document.createElement('div');
        status.className = 'status';
        status.textContent = 'API Key saved successfully!';
        document.body.appendChild(status);

        // Remove the status message after 2 seconds
        setTimeout(() => {
            status.remove();
        }, 2000);
    });
});

// Load the saved API key when the popup is opened
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get('apiKey', (data) => {
        if (data.apiKey) {
            document.getElementById('apiKey').value = data.apiKey;
        }
    });
});
