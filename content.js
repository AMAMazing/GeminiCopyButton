// content.js

//  Placeholder Text Logic (Unchanged)
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
    // This function remains unchanged and will continue to manage the input placeholder text.
    const textarea = document.querySelector('textarea.textarea.gmat-body-medium, textarea[placeholder*="example prompt"], textarea[aria-label*="example prompt"]');
    if (textarea) {
        if (textarea.placeholder !== DESIRED_PLACEHOLDER_TEXT) {
            textarea.placeholder = DESIRED_PLACEHOLDER_TEXT;
        }
        const currentAriaLabel = textarea.getAttribute('aria-label');
        if (currentAriaLabel && currentAriaLabel.includes("example prompt") && currentAriaLabel !== DESIRED_PLACEHOLDER_TEXT) {
            textarea.setAttribute('aria-label', DESIRED_PLACEHOLDER_TEXT);
        }
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
        if (textareaSpecificObserver) textareaSpecificObserver.disconnect();
        textareaSpecificObserver = null;
    }
    const rollingPlaceholder = document.querySelector('ms-input-rolling-placeholder');
    if (rollingPlaceholder) {
        if (rollingPlaceholder.textContent.trim() !== DESIRED_PLACEHOLDER_TEXT) {
            while (rollingPlaceholder.firstChild) {
                rollingPlaceholder.removeChild(rollingPlaceholder.firstChild);
            }
            rollingPlaceholder.textContent = DESIRED_PLACEHOLDER_TEXT;
        }
        if (!rollingPlaceholderSpecificObserver) {
            rollingPlaceholderSpecificObserver = new MutationObserver(() => {
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
        if (rollingPlaceholderSpecificObserver) rollingPlaceholderSpecificObserver.disconnect();
        rollingPlaceholderSpecificObserver = null;
        const placeholderOverlayDiv = document.querySelector('div.placeholder-overlay[slot="autosize-textarea"]');
        if (placeholderOverlayDiv && !placeholderOverlayDiv.querySelector('ms-input-rolling-placeholder')) {
             if (placeholderOverlayDiv.textContent.trim() !== DESIRED_PLACEHOLDER_TEXT) {
                while (placeholderOverlayDiv.firstChild) {
                    placeholderOverlayDiv.removeChild(placeholderOverlayDiv.firstChild);
                }
                placeholderOverlayDiv.textContent = DESIRED_PLACEHOLDER_TEXT;
            }
        }
    }
}

// AI Studio Functions (Unchanged)
function waitForStableTextAndInsertCopyButton(messageContainer) {
    if (!messageContainer) return;
    const checkInterval = setInterval(() => {
        const likeButton = messageContainer.querySelector('mat-icon[data-mat-icon-type="font"]');
        if (likeButton) {
            clearInterval(checkInterval);
            const responseElement = messageContainer.querySelector('.model-prompt-container');
            if (!responseElement) {
                createAIStudioCopyButton(messageContainer);
                return;
            }
            let lastText = responseElement.innerText.trim();
            let stabilityTimeout = 500;
            let stabilityTimer = setTimeout(() => {
                if (responseElement.innerText.trim() === lastText) {
                    clearInterval(textChangeInterval);
                    createAIStudioCopyButton(messageContainer);
                }
            }, stabilityTimeout);
            const textChangeInterval = setInterval(() => {
                let currentText = responseElement.innerText.trim();
                if (currentText !== lastText) {
                    lastText = currentText;
                    clearTimeout(stabilityTimer);
                    stabilityTimer = setTimeout(() => {
                        if (responseElement.innerText.trim() === lastText) {
                            clearInterval(textChangeInterval);
                            createAIStudioCopyButton(messageContainer);
                        }
                    }, stabilityTimeout);
                }
            }, 500);
        }
    }, 300);
}

function createAIStudioCopyButton(messageContainer) {
    if (!messageContainer || messageContainer.querySelector('.custom-copy-button')) {
        return;
    }
    const copyButton = document.createElement('button');
    copyButton.className = 'custom-copy-button';
    copyButton.textContent = 'Copy Response';
    copyButton.style.cssText = `
        padding: 4px 12px; background-color: #1a73e8; color: white; border: none;
        border-radius: 4px; cursor: pointer; font-size: 13px; margin-left: 8px; float: right;
    `;
    copyButton.addEventListener('mouseover', () => { copyButton.style.backgroundColor = '#1557b0'; });
    copyButton.addEventListener('mouseout', () => {
        if (copyButton.textContent === 'Copy Response') { copyButton.style.backgroundColor = '#1a73e8'; }
    });
    copyButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const responseElement = messageContainer.querySelector('.model-prompt-container');
        let responseContent = '';
        if (responseElement) {
            const clonedElement = responseElement.cloneNode(true);
            const generatedLabel = clonedElement.querySelector('span.name');
            if (generatedLabel && /^(Generated|generates)/i.test(generatedLabel.innerText)) {
                generatedLabel.remove();
            }
            responseContent = clonedElement.innerText;
        }
        responseContent = responseContent.replace(/IGNORE_WHEN_COPYING_START[\s\S]*?IGNORE_WHEN_COPYING_END/g, '').trim();
        navigator.clipboard.writeText(responseContent).then(() => {
            copyButton.textContent = 'Copied!';
            copyButton.style.backgroundColor = '#34a853';
            setTimeout(() => {
                copyButton.textContent = 'Copy Response';
                copyButton.style.backgroundColor = '#1a73e8';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            copyButton.textContent = 'Error!';
            copyButton.style.backgroundColor = '#ea4335';
            setTimeout(() => {
                copyButton.textContent = 'Copy Response';
                copyButton.style.backgroundColor = '#1a73e8';
            }, 2000);
        });
    });
    let footerContainer = messageContainer.querySelector('.turn-footer');
    if (!footerContainer) {
        footerContainer = document.createElement('div');
        footerContainer.className = 'turn-footer custom-extension-footer';
        footerContainer.style.cssText = 'padding-top: 8px; text-align: right; clear: both;';
        messageContainer.appendChild(footerContainer);
    }
    if (!footerContainer.querySelector('.custom-copy-button')) {
        footerContainer.appendChild(copyButton);
    }
}


// Gemini-Specific Functions
function addGeminiCopyToResponse(responseElement) {
    const observer = new MutationObserver(() => {
        ensureGeminiButtonIsPresent(responseElement);
    });
    observer.observe(responseElement, { childList: true, subtree: true });
    ensureGeminiButtonIsPresent(responseElement);
}

function ensureGeminiButtonIsPresent(responseElement) {
    // --- THIS IS THE FIX ---
    // First, define the trigger: the native toolbar at the bottom.
    const bottomToolbar = responseElement.querySelector('message-actions');

    // Next, define the location for our button: the main content area.
    const contentContainer = responseElement.querySelector('.response-container-content');

    // If EITHER the trigger (bottom toolbar) OR the location doesn't exist, stop.
    // This ensures our button only appears when the response is fully loaded.
    if (!bottomToolbar || !contentContainer) {
        return;
    }

    // If both exist, check if our button is already there to prevent duplicates.
    if (contentContainer.querySelector('.gemini-custom-button-wrapper')) {
        return;
    }

    // If we've passed all checks, create the button.
    createGeminiCopyButton(responseElement, contentContainer);
}

function createGeminiCopyButton(responseElement, contentContainer) {
    // Create a wrapper to manage layout
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'gemini-custom-button-wrapper';
    buttonWrapper.style.cssText = 'margin-bottom: 8px; overflow: auto;';

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy Response';
    
    // Use the precise styles for a perfect match
    copyButton.style.cssText = `
        box-sizing: border-box; font-family: "Google Sans Text", "Helvetica Neue", sans-serif;
        font-size: 13px; font-weight: 500; line-height: 20px; color: white;
        background-color: #1a73e8; border: none; border-radius: 4px; padding: 4px 12px;
        margin-left: 8px; float: right; cursor: pointer;
    `;
    
    // Identical hover effects
    copyButton.addEventListener('mouseover', () => { copyButton.style.backgroundColor = '#1557b0'; });
    copyButton.addEventListener('mouseout', () => {
        if (copyButton.textContent === 'Copy Response') { copyButton.style.backgroundColor = '#1a73e8'; }
    });

    // Identical click handler logic
    copyButton.addEventListener('click', (event) => {
        event.stopPropagation();
        event.preventDefault();
        const markdownElement = responseElement.querySelector('.markdown');
        if (!markdownElement) {
            console.error("Copy Error: Could not find '.markdown' content element.");
            return;
        }
        navigator.clipboard.writeText(markdownElement.innerText).then(() => {
            copyButton.textContent = 'Copied!';
            copyButton.style.backgroundColor = '#34a853';
            setTimeout(() => {
                copyButton.textContent = 'Copy Response';
                copyButton.style.backgroundColor = '#1a73e8';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text for Gemini: ', err);
            copyButton.textContent = 'Error!';
            copyButton.style.backgroundColor = '#ea4335';
            setTimeout(() => {
                copyButton.textContent = 'Copy Response';
                copyButton.style.backgroundColor = '#1a73e8';
            }, 2000);
        });
    });

    buttonWrapper.appendChild(copyButton);
    contentContainer.prepend(buttonWrapper);
}


// Unified Main Observer (Unchanged)
function observeMessages() {
    console.log("🚀 Initializing unified content script...");
    ensureStaticInputPlaceholder();

    const mainBodyObserver = new MutationObserver((mutationsList) => {
        ensureStaticInputPlaceholder();
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;

                    //  AI Studio Logic
                    if (node.querySelector('.model-prompt-container')) {
                         node.querySelectorAll('.model-prompt-container').forEach(container => {
                            if (container.parentElement) {
                                waitForStableTextAndInsertCopyButton(container.parentElement);
                            }
                        });
                    }

                    //  Gemini Logic
                    if (node.querySelector('model-response') || node.matches('model-response')) {
                         const geminiResponses = node.querySelectorAll('model-response');
                         geminiResponses.forEach(addGeminiCopyToResponse);
                         if (node.matches('model-response')) {
                            addGeminiCopyToResponse(node);
                         }
                    }
                }
            }
        }
    });
    mainBodyObserver.observe(document.body, { childList: true, subtree: true });
}


observeMessages();