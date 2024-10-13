// src/background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "inputFields") {
    // Store the input fields data
    chrome.storage.local.set({ inputFields: message.inputs });
  } else if (message.type === "inputFilled") {
    // Optionally handle input filled events
    console.log(`Input with ID ${message.id} filled with value: ${message.value}`);
  } else if (message.type === "generateInput") {
    const { placeholder } = message;
    
    // Retrieve the API key securely from storage
    chrome.storage.local.get("apiKey", async (result) => {
      const apiKey = result.apiKey;
      if (!apiKey) {
        sendResponse({ success: false, error: "API key not found." });
        return;
      }

      // Construct the messages array
      const messages = [
        {
          "role": "system",
          "content": "You are a helpful assistant that generates suitable input for form fields."
        },
        {
          "role": "user",
          "content": `Generate a suitable input for a field with placeholder "${placeholder || 'N/A'} be creative"`
        }
      ];

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // "Authorization": ``,
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: messages,
            max_tokens: 50,
            n: 1,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`OpenAI API error: ${response.status} - ${response.statusText}`, errorData);
          sendResponse({ success: false, error: `API Error: ${response.statusText}` });
          return;
        }

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
          console.error("No choices returned from OpenAI");
          sendResponse({ success: false, error: "No response from API." });
          return;
        }

        const generatedValue = data.choices[0].message.content.trim();

        sendResponse({ success: true, value: generatedValue });
      } catch (error) {
        console.error("Error communicating with OpenAI:", error);
        sendResponse({ success: false, error: "Failed to communicate with API." });
      }
    });

    return true; // Indicates asynchronous response
  }
});

// Listen for the keyboard shortcut command
chrome.commands.onCommand.addListener((command) => {
  if (command === "fill-focused-input") {
    // Query the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        // Send a message to the content script to fill the focused input
        chrome.tabs.sendMessage(tabs[0].id, { type: "fillFocusedInput" });
      }
    });
  }
});
