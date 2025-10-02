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

// Utility function to remove elements with classes containing specific text
function removeElementsWithClassContaining(container, classSubstring) {
    const elements = container.querySelectorAll('*');
    elements.forEach(element => {
        if (element.className && typeof element.className === 'string') {
            if (element.className.includes(classSubstring)) {
                element.remove();
            }
        } else if (element.classList) {
            // Handle cases where className might not be a string
            const classArray = Array.from(element.classList);
            if (classArray.some(className => className.includes(classSubstring))) {
                element.remove();
            }
        }
    });
}

// --- UPDATED --- Auto Skip Button Function is now simpler
function tryClickSkipButton(node) {
    // Looks for the skip button within the newly added node.
    // This is more efficient than searching the whole document every time.
    const skipButton = node.querySelector('button[data-test-id="skip-button"]');
    if (skipButton) {
        console.log("AI Studio Skip button found, clicking now.");
        skipButton.click();
        return true; // Indicate that we found and clicked it
    }
    return false; // Indicate it wasn't found
}


// AI Studio Functions (Unchanged)
function waitForStableTextAndInsertCopyButton(messageContainer) {
    if (!messageContainer) return;
    const checkInterval = setInterval(() => {
        const thumbsDownButton = messageContainer.querySelector('button[iconname="thumb_down"]');
        if (thumbsDownButton) {
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
    const footerContainer = messageContainer.querySelector('div.turn-footer.ng-star-inserted');
    const imageElement = messageContainer.querySelector('.image-container img, img.decoded-image, img[src^="blob:"]');

    if (!footerContainer) {
        console.warn("AI Studio Copy Button: Could not find footer container.");
        return;
    }

    // Check if this is a response with an image
    if (imageElement) {
        // --- NEW LOGIC FOR IMAGE RESPONSE ---
        // Create only the "Copy Image" button.

        if (footerContainer.querySelector('.custom-copy-image-button')) {
            return; // Button already exists
        }

        const copyImageButton = document.createElement('button');
        copyImageButton.className = 'custom-copy-image-button';
        copyImageButton.textContent = 'Copy Image';
        copyImageButton.style.cssText = `
            padding: 4px 12px; background-color: #34a853; color: white; border: none;
            border-radius: 4px; cursor: pointer; font-size: 13px; margin-left: 8px;
        `;
        copyImageButton.addEventListener('mouseover', () => { copyImageButton.style.backgroundColor = '#2c8a42'; });
        copyImageButton.addEventListener('mouseout', () => {
            if (copyImageButton.textContent === 'Copy Image') { copyImageButton.style.backgroundColor = '#34a853'; }
        });
        copyImageButton.addEventListener('click', async (event) => {
            event.stopPropagation();
            copyImageButton.textContent = 'Copying...';
            try {
                const response = await fetch(imageElement.src);
                const blob = await response.blob();
                await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                copyImageButton.textContent = 'Image Copied!';
                setTimeout(() => {
                    copyImageButton.textContent = 'Copy Image';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy image:', err);
                copyImageButton.textContent = 'Error!';
                copyImageButton.style.backgroundColor = '#ea4335';
                setTimeout(() => {
                    copyImageButton.textContent = 'Copy Image';
                    copyImageButton.style.backgroundColor = '#34a853';
                }, 2000);
            }
        });
        footerContainer.appendChild(copyImageButton);

    } else {
        // --- ORIGINAL LOGIC FOR TEXT-ONLY RESPONSE ---
        if (footerContainer.querySelector('.custom-copy-button')) {
            return;
        }
        const copyButton = document.createElement('button');
        copyButton.className = 'custom-copy-button';
        copyButton.textContent = 'Copy Response';
        copyButton.style.cssText = `
            padding: 4px 12px; background-color: #1a73e8; color: white; border: none;
            border-radius: 4px; cursor: pointer; font-size: 13px; margin-left: 8px;
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
                removeElementsWithClassContaining(clonedElement, 'code-block-decoration');
                removeElementsWithClassContaining(clonedElement, 'mat-expansion-panel-header');
                const generatedLabel = clonedElement.querySelector('span.name');
                if (generatedLabel && /^(Generated|generates)/i.test(generatedLabel.innerText)) {
                    generatedLabel.remove();
                }
                responseContent = clonedElement.innerText;
            }
            responseContent = responseContent.replace(/^\s*$(?:\r\n?|\n)/gm, "").trim();
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
        footerContainer.appendChild(copyButton);
    }
}


// Gemini-Specific Functions (Unchanged)
function addGeminiCopyToResponse(responseElement) {
    const observer = new MutationObserver(() => {
        ensureGeminiButtonIsPresent(responseElement);
    });
    observer.observe(responseElement, { childList: true, subtree: true });
    ensureGeminiButtonIsPresent(responseElement);
}

function ensureGeminiButtonIsPresent(responseElement) {
    const bottomToolbar = responseElement.querySelector('message-actions');
    const contentContainer = responseElement.querySelector('.response-container-content');
    if (!bottomToolbar || !contentContainer) {
        return;
    }
    if (contentContainer.querySelector('.gemini-custom-button-wrapper')) {
        return;
    }
    createGeminiCopyButton(responseElement, contentContainer);
}

function createGeminiCopyButton(responseElement, contentContainer) {
    const buttonWrapper = document.createElement('div');
    buttonWrapper.className = 'gemini-custom-button-wrapper';
    buttonWrapper.style.cssText = 'margin-bottom: 8px; overflow: auto;';
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy Response';
    copyButton.style.cssText = `
        box-sizing: border-box; font-family: "Google Sans Text", "Helvetica Neue", sans-serif;
        font-size: 13px; font-weight: 500; line-height: 20px; color: white;
        background-color: #1a73e8; border: none; border-radius: 4px; padding: 4px 12px;
        margin-left: 8px; float: right; cursor: pointer;
    `;
    copyButton.addEventListener('mouseover', () => { copyButton.style.backgroundColor = '#1557b0'; });
    copyButton.addEventListener('mouseout', () => {
        if (copyButton.textContent === 'Copy Response') { copyButton.style.backgroundColor = '#1a73e8'; }
    });

    copyButton.addEventListener('click', (event) => {
        event.stopPropagation();
        event.preventDefault();

        const markdownElement = responseElement.querySelector('.markdown');
        if (!markdownElement) {
            console.error("Copy Error: Could not find '.markdown' content element.");
            return;
        }
        
        const clonedMarkdown = markdownElement.cloneNode(true);
        removeElementsWithClassContaining(clonedMarkdown, 'code-block-decoration');
        const codeBlockHeaders = clonedMarkdown.querySelectorAll('div.code-block-decoration');
        codeBlockHeaders.forEach(header => header.remove());
        const textToCopy = clonedMarkdown.innerText;

        navigator.clipboard.writeText(textToCopy).then(() => {
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


// --- UPDATED --- Unified Main Observer 
function observeMessages() {
    console.log("🚀 Initializing unified content script...");
    ensureStaticInputPlaceholder();

    const mainBodyObserver = new MutationObserver((mutationsList) => {
        ensureStaticInputPlaceholder();
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;

                    // --- NEW, ROBUST LOGIC FOR SKIP BUTTON ---
                    // Always check any new node to see if it contains the skip button.
                    tryClickSkipButton(node);

                    //  AI Studio Copy Button Logic
                    if (node.querySelector('.model-prompt-container') || node.closest('.model-prompt-container')) {
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