function observeMessages() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) { // Ensure it's an element
            // Find newly added .model-prompt-container(s)
            const messageContainers = node.querySelectorAll('.model-prompt-container');
            messageContainers.forEach(container => {
              waitForDoneAndInsertCopyButton(container.parentElement);
            });
          }
        }
      }
    });
  
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Wait for the "done" indicator (like button), then add the copy button
  function waitForDoneAndInsertCopyButton(messageContainer) {
    const checkInterval = setInterval(() => {
      const likeButton = messageContainer.querySelector(
        'mat-icon[data-mat-icon-type="font"]'
      );
  
      if (likeButton) {
        clearInterval(checkInterval);
  
        // Delay a bit to ensure text has finished loading
        setTimeout(() => {
          createCopyButton(messageContainer);
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
  
    copyButton.addEventListener('click', () => {
      const responseElement = messageContainer.querySelector('.model-prompt-container');
      let responseContent = responseElement ? responseElement.innerText.trim() : '';
  
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
  
    // Append the button to the message container
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
  