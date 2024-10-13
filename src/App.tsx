// src/App.jsx

import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [inputs, setInputs] = useState([]);

  useEffect(() => {
    // Function to fetch input fields from storage
    const fetchInputs = async () => {
      const storedData = await chrome.storage.local.get("inputFields");
      if (storedData.inputFields) {
        setInputs(storedData.inputFields);
      }
    };

    // Listen for changes in storage
    const handleStorageChange = (changes: any, area: any) => {
      if (area === "local" && changes.inputFields) {
        setInputs(changes.inputFields.newValue);
      }
    };

    fetchInputs();
    chrome.storage.onChanged.addListener(handleStorageChange);

    // Cleanup listener on unmount
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Function to send a fill request to the content script
  const handleFill = (input: any) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (id, type) => {
            const inputElement = document.getElementById(id);
            if (inputElement) {
              if (type === "email") {
                const username =
                  "user" + Math.random().toString(36).substring(2, 10);
                const domain =
                  "example" + Math.random().toString(36).substring(2, 6);
                (
                  inputElement as HTMLInputElement
                ).value = `${username}@${domain}.com`;
              } else {
                (inputElement as HTMLInputElement).value = Math.random()
                  .toString(36)
                  .substring(2, 10);
              }

              // Add a highlight effect
              inputElement.classList.add("autofill-highlight");
              setTimeout(() => {
                inputElement.classList.remove("autofill-highlight");
              }, 2000);
            }
          },
          args: [input.id, input.type],
        });
      }
    });
  };

  return (
    <>
      <div className="main-container">
        <h1>Dr. Fill</h1>
        <p className="description">
          This extension will automatically fill in input fields on a webpage
          based on your own knowledgebase.
        </p>
        <div className="card">
          {inputs.length === 0 ? (
            <p>No input fields found on this page.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Type</th>
                  <th>Placeholder</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {inputs.map((input, index) => (
                  <tr key={index}>
                    <td>{(input as any).label || "N/A"}</td>
                    <td>{(input as any).type}</td>
                    <td>{(input as any).placeholder || "N/A"}</td>
                    <td>
                      <button
                        className="fill-button"
                        onClick={() => handleFill(input)}
                      >
                        Fill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
