// content.js

const DESIRED_PLACEHOLDER_TEXT = "Type something";
let textareaSpecificObserver = null;
let rollingPlaceholderSpecificObserver = null;

function disconnectSpecificObservers() {
    if (textareaSpecificObserver) {
        textareaSpecificObserver.disconnect();
        textareaSpecificObserver = null;
    }
    if (rollingPlaceholderSpecificObserver) {
        rollingPlaceholderSpecificObserver.disconnect();
        rollingPlaceholderSpecificObserver = null;
    }
}

function ensureStaticInputPlaceholder() {
    // Target the textarea element
    // The selector combines class and attribute checks for robustness.
    const textarea = document.querySelector('textarea.textarea.gmat-body-medium, textarea[placeholder*="example prompt"], textarea[aria-label*="example prompt"]');
    if (textarea) {
        if (textarea.placeholder !== DESIRED_PLACEHOLDER_TEXT) {
            textarea.placeholder = DESIRED_PLACEHOLDER_TEXT;
        }
        // Also update aria-label if it's used for display or accessibility and contains the dynamic part
        const currentAriaLabel = textarea.getAttribute('aria-label');
        if (currentAriaLabel && currentAriaLabel.includes("example prompt") && currentAriaLabel !== DESIRED_PLACEHOLDER_TEXT) {
            textarea.setAttribute('aria-label', DESIRED_PLACEHOLDER_TEXT);
        }

        // Set up a specific observer for the textarea's attributes if not already done
        if (!textareaSpecificObserver) {
            textareaSpecificObserver = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes') {
                        if (mutation.attributeName === 'placeholder' && textarea.placeholder !== DESIRED_PLACEHOLDER_TEXT) {
                            textarea.placeholder = DESIRED_PLACEHOLDER_TEXT;
                        }
                        if (mutation.attributeName === 'aria-label') {
                            const newAriaLabel = textarea.getAttribute('aria-label');
                            if (newAriaLabel && newAriaLabel.includes("example prompt") && newAriaLabel !== DESIRED_PLACEHOLDER_TEXT) {
                                textarea.setAttribute('aria-label', DESIRED_PLACEHOLDER_TEXT);
                            }
                        }
                    }
                });
            });
            textareaSpecificObserver.observe(textarea, { attributes: true });
        }
    } else {
        // If textarea is not found, previous specific observer might be stale
        if (textareaSpecificObserver) textareaSpecificObserver.disconnect();
        textareaSpecificObserver = null;
    }

    // Target the visual rolling placeholder element
    const rollingPlaceholder = document.querySelector('ms-input-rolling-placeholder');
    if (rollingPlaceholder) {
        if (rollingPlaceholder.textContent.trim() !== DESIRED_PLACEHOLDER_TEXT) {
            // Clear any existing children (like animated spans) to stop animation
            while (rollingPlaceholder.firstChild) {
                rollingPlaceholder.removeChild(rollingPlaceholder.firstChild);
            }
            rollingPlaceholder.textContent = DESIRED_PLACEHOLDER_TEXT;
        }

        // Set up a specific observer for the rolling placeholder's content
        if (!rollingPlaceholderSpecificObserver) {
            rollingPlaceholderSpecificObserver = new MutationObserver(mutations => {
                // If children are added/removed or text changes, reset it
                if (rollingPlaceholder.textContent.trim() !== DESIRED_PLACEHOLDER_TEXT) {
                    while (rollingPlaceholder.firstChild) {
                        rollingPlaceholder.removeChild(rollingPlaceholder.firstChild);
                    }
                    rollingPlaceholder.textContent = DESIRED_PLACEHOLDER_TEXT;
                }
            });
            rollingPlaceholderSpecificObserver.observe(rollingPlaceholder, { childList: true, characterData: true, subtree: true });
        }
    } else {
        // If rolling placeholder is not found, previous specific observer might be stale
        if (rollingPlaceholderSpecificObserver) rollingPlaceholderSpecificObserver.disconnect();
        rollingPlaceholderSpecificObserver = null;

        // Fallback: If ms-input-rolling-placeholder isn't found,
        // try the parent div that sometimes holds placeholder text.
        const placeholderOverlayDiv = document.querySelector('div.placeholder-overlay[slot="autosize-textarea"]');
        if (placeholderOverlayDiv && !placeholderOverlayDiv.querySelector('ms-input-rolling-placeholder')) {
             if (placeholderOverlayDiv.textContent.trim() !== DESIRED_PLACEHOLDER_TEXT) {
                while (placeholderOverlayDiv.firstChild) {
                    placeholderOverlayDiv.removeChild(placeholderOverlayDiv.firstChild);
                }
                placeholderOverlayDiv.textContent = DESIRED_PLACEHOLDER_TEXT;
                // A specific observer could be added here too if this path is common and dynamic
            }
        }
    }
}

// --- Your existing code (with minor adjustments for clarity/robustness) ---
function observeMessages() {
  // Initial attempt to find and fix placeholders, and set up specific observers
  ensureStaticInputPlaceholder();

  const mainBodyObserver = new MutationObserver((mutationsList, observer) => {
    // (Re-)Find and fix placeholders if they appear or are re-created.
    // This will also re-establish specific observers if the elements were removed and re-added.
    ensureStaticInputPlaceholder();

    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) { // Ensure it's an element
            // Find newly added .model-prompt-container(s)
            const messageContainers = node.querySelectorAll('.model-prompt-container');
            messageContainers.forEach(container => {
              // Pass the parent element, as the original code structure implies
              // the copy button is added to this parent.
              if (container.parentElement) {
                  waitForStableTextAndInsertCopyButton(container.parentElement);
              }
            });

            // Also check if the added node *itself* is a parent containing a .model-prompt-container
            // This can happen if a whole message block is added at once.
            if (node.querySelector && node.matches && node.querySelector('.model-prompt-container')) {
                const modelPromptInNode = node.querySelector('.model-prompt-container');
                if (modelPromptInNode && modelPromptInNode.parentElement === node) { // Ensure it's a direct child's parent
                    waitForStableTextAndInsertCopyButton(node);
                } else if (modelPromptInNode && modelPromptInNode.parentElement) { // Or any descendant
                    waitForStableTextAndInsertCopyButton(modelPromptInNode.parentElement);
                }
            }
          }
        }
      }
    }
  });

  mainBodyObserver.observe(document.body, { childList: true, subtree: true });
}

// Wait for "done" button AND no text changes for 500ms
function waitForStableTextAndInsertCopyButton(messageContainer) {
  if (!messageContainer) return;

  const checkInterval = setInterval(() => {
    // The 'likeButton' (mat-icon) is used as an indicator that the response might be complete.
    const likeButton = messageContainer.querySelector('mat-icon[data-mat-icon-type="font"]');

    if (likeButton) {
      clearInterval(checkInterval);

      const responseElement = messageContainer.querySelector('.model-prompt-container');
      if (!responseElement) {
        // If the expected text element isn't found, we can't reliably check for stability.
        // Decide whether to add the button anyway or log an error.
        // console.warn("Could not find .model-prompt-container in:", messageContainer);
        createCopyButton(messageContainer); // Attempt to add button, it will handle missing responseElement
        return;
      }

      // Monitor text changes for stability
      let lastText = responseElement.innerText.trim();
      let stabilityCheckInterval = 500; // How often to check for text changes
      let stabilityTimeout = 500;       // How long the text must be stable before confirming

      let stabilityTimer = setTimeout(() => { // Initial check after stabilityTimeout
        if (responseElement.innerText.trim() === lastText) {
          clearInterval(textChangeInterval);
          createCopyButton(messageContainer);
        }
      }, stabilityTimeout);

      const textChangeInterval = setInterval(() => {
        let currentText = responseElement.innerText.trim();
        if (currentText !== lastText) {
          lastText = currentText;
          clearTimeout(stabilityTimer); // Reset stability timer
          stabilityTimer = setTimeout(() => {
            if (responseElement.innerText.trim() === lastText) { // Check again after new stability period
              clearInterval(textChangeInterval);
              createCopyButton(messageContainer);
            }
          }, stabilityTimeout);
        }
      }, stabilityCheckInterval);

    }
  }, 300); // Check for the 'likeButton' presence every 300ms
}

// Create the copy button
function createCopyButton(messageContainer) {
  if (!messageContainer || messageContainer.querySelector('.custom-copy-button')) {
    return; // Avoid duplicate buttons or if container is invalid
  }

  const copyButton = document.createElement('button');
  copyButton.className = 'custom-copy-button';
  copyButton.innerHTML = 'Copy Response';
  copyButton.style.cssText = `
    padding: 4px 12px;
    background-color: #1a73e8;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    margin-left: 8px;
    float: right; 
  `; // Note: float: right might require parent to clear floats or use flexbox.

  copyButton.addEventListener('mouseover', () => {
    copyButton.style.backgroundColor = '#1557b0';
  });
  copyButton.addEventListener('mouseout', () => {
    copyButton.style.backgroundColor = '#1a73e8';
  });

  copyButton.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent triggering other click listeners on parent elements
    const responseElement = messageContainer.querySelector('.model-prompt-container');
    let responseContent = '';
    if (responseElement) {
        responseContent = responseElement.innerText.trim();
    } else {
        // Fallback: If .model-prompt-container is not directly inside messageContainer,
        // we might need a more specific selector or to adjust what 'messageContainer' refers to.
        // For now, if not found, responseContent remains empty.
        console.warn("Copy button: .model-prompt-container not found within the provided message container for copying.");
    }

    // Remove IGNORE_WHEN_COPYING blocks
    responseContent = responseContent.replace(/IGNORE_WHEN_COPYING_START[\s\S]*?IGNORE_WHEN_COPYING_END/g, '');

    navigator.clipboard.writeText(responseContent).then(() => {
      copyButton.innerHTML = 'Copied!';
      copyButton.style.backgroundColor = '#34a853';
      setTimeout(() => {
        copyButton.innerHTML = 'Copy Response';
        copyButton.style.backgroundColor = '#1a73e8';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      copyButton.innerHTML = 'Error!';
      copyButton.style.backgroundColor = '#ea4335';
      setTimeout(() => {
        copyButton.innerHTML = 'Copy Response';
        copyButton.style.backgroundColor = '#1a73e8';
      }, 2000);
    });
  });

  // Appending the button:
  // The original code looked for '.turn-footer' or created one within messageContainer.
  let footerContainer = messageContainer.querySelector('.turn-footer');
  if (!footerContainer) {
    footerContainer = document.createElement('div');
    footerContainer.className = 'turn-footer custom-extension-footer'; // Added custom class
    footerContainer.style.paddingTop = '8px'; // Add some space if creating new
    footerContainer.style.textAlign = 'right'; // Helps if button is only child & floated
    footerContainer.style.clear = 'both'; // If previous elements were floated
    messageContainer.appendChild(footerContainer);
  }

  // Ensure button is not added multiple times to the same footer
  if (!footerContainer.querySelector('.custom-copy-button')) {
      footerContainer.appendChild(copyButton);
  }
}

// Start observing for messages and placeholders
observeMessages();