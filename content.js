function observeMessages() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Ensure it's an element
          // Find newly added .model-prompt-container(s)
          const messageContainers = node.querySelectorAll('.model-prompt-container');
          messageContainers.forEach(container => {
            waitForStableTextAndInsertCopyButton(container.parentElement);
          });
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Wait for "done" button AND no text changes for 500ms
function waitForStableTextAndInsertCopyButton(messageContainer) {
  const checkInterval = setInterval(() => {
    const likeButton = messageContainer.querySelector('mat-icon[data-mat-icon-type="font"]');

    if (likeButton) {
      clearInterval(checkInterval);

      // Monitor text changes for stability
      let lastText = messageContainer.innerText.trim();
      let stabilityCheck = setInterval(() => {
        let currentText = messageContainer.innerText.trim();

        if (currentText === lastText) { // No new text for 500ms
          clearInterval(stabilityCheck);
          setTimeout(() => {
            if (messageContainer.innerText.trim() === lastText) { // Confirm again
              createCopyButton(messageContainer);
            }
          }, 500);
        } else {
          lastText = currentText; // Reset timer if new text appears
        }
      }, 500);
    }
  }, 300);
}

// Create the copy button
function createCopyButton(messageContainer) {
  if (messageContainer.querySelector('.custom-copy-button')) {
    return; // Avoid duplicate buttons
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
  `;

  copyButton.addEventListener('mouseover', () => {
    copyButton.style.backgroundColor = '#1557b0';
  });
  copyButton.addEventListener('mouseout', () => {
    copyButton.style.backgroundColor = '#1a73e8';
  });

  copyButton.addEventListener('click', () => {
    const responseElement = messageContainer.querySelector('.model-prompt-container');
    let responseContent = responseElement ? responseElement.innerText.trim() : '';

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

  let footerContainer = messageContainer.querySelector('.turn-footer');
  if (!footerContainer) {
    footerContainer = document.createElement('div');
    footerContainer.className = 'turn-footer';
    footerContainer.style.padding = '8px';
    messageContainer.appendChild(footerContainer);
  }

  footerContainer.appendChild(copyButton);
}

// Start observing for messages
observeMessages();
