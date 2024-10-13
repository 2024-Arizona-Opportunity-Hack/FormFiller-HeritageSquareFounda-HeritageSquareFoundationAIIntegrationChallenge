// src/contentScript.js

// Inject CSS for the Fill buttons
const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.type = "text/css";
styleLink.href = chrome.runtime.getURL("autofillStyles.css");
(document.head || document.documentElement).appendChild(styleLink);

// Function to create and style the "Fill" button
function createFillButton(input, identifier) {
  // Avoid adding multiple buttons to the same input
  if (
    input.nextSibling &&
    input.nextSibling.classList &&
    input.nextSibling.classList.contains("autofill-button")
  ) {
    return;
  }

  const button = document.createElement("button");
  button.innerText = "Fill";
  button.className = "autofill-button";
  button.type = "button"; // Prevent form submission

  // Event listener for the button
  button.addEventListener("click", () => {
    fillInput(input, identifier);
  });

  // Insert the button right after the input field
  input.parentNode.insertBefore(button, input.nextSibling);
}

// Function to fill the input field with data generated from OpenAI
function fillInput(input, identifier) {
  // Get the placeholder to generate a suitable prompt
  const placeholder = input.placeholder || '';

  // Send a message to the background script to generate input
  chrome.runtime.sendMessage(
    { type: "generateInput", placeholder: placeholder },
    (response) => {
      if (response && response.success) {
        input.value = response.value;

        // Add a highlight effect
        input.classList.add("autofill-highlight");
        setTimeout(() => {
          input.classList.remove("autofill-highlight");
        }, 2000);

        // Notify the background script about the fill action
        chrome.runtime.sendMessage({
          type: "inputFilled",
          id: identifier,
          value: input.value,
        });
      } else {
        console.error("Failed to generate input:", response.error);
        alert("Failed to generate input. Please try again.");
      }
    }
  );
}

// Function to scan and append buttons to relevant input fields
function appendFillButtons() {
  // Select all input elements except those of type 'hidden', 'submit', 'button', 'reset', and 'file'
  const inputs = document.querySelectorAll(
    "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='file'])"
  );
// src/contentScript.js

// Inject CSS for the Fill buttons
const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.type = "text/css";
styleLink.href = chrome.runtime.getURL("autofillStyles.css");
(document.head || document.documentElement).appendChild(styleLink);

// Function to create and style the "Fill" button
function createFillButton(input, identifier) {
  // Avoid adding multiple buttons to the same input
  if (
    input.nextSibling &&
    input.nextSibling.classList &&
    input.nextSibling.classList.contains("autofill-button")
  ) {
    return;
  }

  const button = document.createElement("button");
  button.innerText = "Fill";
  button.className = "autofill-button";
  button.type = "button"; // Prevent form submission

  // Event listener for the button
  button.addEventListener("click", () => {
    fillInput(input, identifier);
  });

  // Insert the button right after the input field
  input.parentNode.insertBefore(button, input.nextSibling);
}

// Function to fill the input field with data generated from OpenAI
function fillInput(input, identifier) {
  // Get the placeholder to generate a suitable prompt
  const placeholder = input.placeholder || '';

  // Send a message to the background script to generate input
  chrome.runtime.sendMessage(
    { type: "generateInput", placeholder: placeholder },
    (response) => {
      if (response && response.success) {
        input.value = response.value;

        // Add a highlight effect
        input.classList.add("autofill-highlight");
        setTimeout(() => {
          input.classList.remove("autofill-highlight");
        }, 2000);

        // Notify the background script about the fill action
        chrome.runtime.sendMessage({
          type: "inputFilled",
          id: identifier,
          value: input.value,
        });
      } else {
        console.error("Failed to generate input:", response.error);
        alert("Failed to generate input. Please try again.");
      }
    }
  );
}

// Function to scan and append buttons to relevant input fields
function appendFillButtons() {
  // Select all input elements except those of type 'hidden', 'submit', 'button', 'reset', and 'file'
  const inputs = document.querySelectorAll(
    "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='file'])"
  );

  const inputDetails = [];

  inputs.forEach((input, index) => {
    // Generate a unique identifier if the input lacks one
    let identifier = input.id;
    if (!identifier) {
      identifier = `autofill-input-${index}-${Date.now()}`;
      input.id = identifier;
    }

    createFillButton(input, identifier);

    // Attempt to find the label associated with the input
    let label = "";
    if (input.labels && input.labels.length > 0) {
      label = input.labels[0].innerText.trim();
    } else if (input.getAttribute("aria-label")) {
      label = input.getAttribute("aria-label").trim();
    } else {
      // Use placeholder or generate a label
      label = input.placeholder
        ? input.placeholder.trim()
        : `Input ${identifier}`;
    }

    inputDetails.push({
      id: identifier,
      type: input.type,
      name: input.name || "",
      label: label || "N/A",
      placeholder: input.placeholder || "",
    });
  });

  // Send the input details to the background script
  chrome.runtime.sendMessage({
    type: "inputFields",
    inputs: inputDetails,
  });
}

// Initial call to append buttons on page load
appendFillButtons();

// Observe the DOM for dynamically added inputs and append buttons accordingly
const observer = new MutationObserver((mutations) => {
  let newInputAdded = false;
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const newInputs = node.querySelectorAll
          ? node.querySelectorAll(
              "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='file'])"
            )
          : [];
        newInputs.forEach((input, index) => {
          let identifier = input.id;
          if (!identifier) {
            identifier = `autofill-input-dynamic-${index}-${Date.now()}`;
            input.id = identifier;
          }
          createFillButton(input, identifier);
          newInputAdded = true;
        });
      }
    });
  });

  if (newInputAdded) {
    appendFillButtons();
  }
});

// Start observing the document body for changes
observer.observe(document.body, { childList: true, subtree: true });

// Listener for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "fillFocusedInput") {
    const activeElement = document.activeElement;
    if (
      activeElement &&
      activeElement.tagName.toLowerCase() === "input" &&
      !activeElement.disabled &&
      activeElement.type !== "hidden" &&
      activeElement.type !== "submit" &&
      activeElement.type !== "button" &&
      activeElement.type !== "reset" &&
      activeElement.type !== "file"
    ) {
      let identifier = activeElement.id;
      if (!identifier) {
        identifier = `autofill-focused-${Date.now()}`;
        activeElement.id = identifier;
      }
      fillInput(activeElement, identifier);
    } else {
      // Notify the user
      alert("Please focus on a valid input field to autofill.");
    }
  }
});

  const inputDetails = [];

  inputs.forEach((input, index) => {
    // Generate a unique identifier if the input lacks one
    let identifier = input.id;
    if (!identifier) {
      identifier = `autofill-input-${index}-${Date.now()}`;
      input.id = identifier;
    }

    createFillButton(input, identifier);

    // Attempt to find the label associated with the input
    let label = "";
    if (input.labels && input.labels.length > 0) {
      label = input.labels[0].innerText.trim();
    } else if (input.getAttribute("aria-label")) {
      label = input.getAttribute("aria-label").trim();
    } else {
      // Use placeholder or generate a label
      label = input.placeholder
        ? input.placeholder.trim()
        : `Input ${identifier}`;
    }

    inputDetails.push({
      id: identifier,
      type: input.type,
      name: input.name || "",
      label: label || "N/A",
      placeholder: input.placeholder || "",
    });
  });

  // Send the input details to the background script
  chrome.runtime.sendMessage({
    type: "inputFields",
    inputs: inputDetails,
  });
}

// Initial call to append buttons on page load
appendFillButtons();

// Observe the DOM for dynamically added inputs and append buttons accordingly
const observer = new MutationObserver((mutations) => {
  let newInputAdded = false;
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const newInputs = node.querySelectorAll
          ? node.querySelectorAll(
              "input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset']):not([type='file'])"
            )
          : [];
        newInputs.forEach((input, index) => {
          let identifier = input.id;
          if (!identifier) {
            identifier = `autofill-input-dynamic-${index}-${Date.now()}`;
            input.id = identifier;
          }
          createFillButton(input, identifier);
          newInputAdded = true;
        });
      }
    });
  });

  if (newInputAdded) {
    appendFillButtons();
  }
});

// Start observing the document body for changes
observer.observe(document.body, { childList: true, subtree: true });

// Listener for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "fillFocusedInput") {
    const activeElement = document.activeElement;
    if (
      activeElement &&
      activeElement.tagName.toLowerCase() === "input" &&
      !activeElement.disabled &&
      activeElement.type !== "hidden" &&
      activeElement.type !== "submit" &&
      activeElement.type !== "button" &&
      activeElement.type !== "reset" &&
      activeElement.type !== "file"
    ) {
      let identifier = activeElement.id;
      if (!identifier) {
        identifier = `autofill-focused-${Date.now()}`;
        activeElement.id = identifier;
      }
      fillInput(activeElement, identifier);
    } else {
      // Notify the user
      alert("Please focus on a valid input field to autofill.");
    }
  }
});
