// Check if the script is running
console.log("Options page script loaded.");

document.getElementById("saveButton").addEventListener("click", () => {
  console.log("Save button clicked.");

  const apiKey = document.getElementById("apiKey").value.trim();
  console.log("API Key entered:", apiKey);

  if (!apiKey) {
    document.getElementById("status").textContent = "API Key cannot be empty.";
    document.getElementById("status").style.color = "red";
    return;
  }

  // Save the API key using Chrome's storage API
  chrome.storage.local.set({ apiKey: apiKey }, () => {
    document.getElementById("status").textContent = "API Key saved successfully!";
    document.getElementById("status").style.color = "green";
    console.log("API Key saved successfully.");
    alert("KEY SUCCESSFILLY SAVED")
  });
});

// Load the saved API key when the options page loads
window.onload = () => {
  console.log("Options page loaded.");
  chrome.storage.local.get("apiKey", (result) => {
    if (result.apiKey) {
      document.getElementById("apiKey").value = result.apiKey;
      console.log("API Key loaded:", result.apiKey);
    } else {
      console.log("No API Key found in storage.");
    }
  });
};

document.getElementById("fillButton").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "fillFromPopup" });
});
