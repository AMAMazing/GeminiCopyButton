// content.js
function createCopyButton(messageContainer) {
    // Check if button already exists in this container
    if (messageContainer.querySelector('.custom-copy-button')) {
        return;
    }

    // Create the button
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
        position: absolute;
        right: 16px;
        bottom: 8px;
    `;

    // Add hover effect
    copyButton.addEventListener('mouseover', () => {
        copyButton.style.backgroundColor = '#1557b0';
    });
    copyButton.addEventListener('mouseout', () => {
        copyButton.style.backgroundColor = '#1a73e8';
    });

    // Add click functionality
    copyButton.addEventListener('click', () => {
        // Get the response content from this specific message container
        const responseContent = messageContainer.querySelector('.model-prompt-container')?.textContent || '';
        
        // Copy to clipboard
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

    // Find or create the tools container in the message
    const toolsContainer = messageContainer.querySelector('.actions-container') || 
                         messageContainer.querySelector('.model-prompt-container');
    if (toolsContainer) {
        toolsContainer.style.position = 'relative';
        toolsContainer.appendChild(copyButton);
    }
}

// Create an observer to watch for new messages
function observeMessages() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    // Look for assistant message containers
                    const messageContainers = node.querySelectorAll('.model-prompt-container');
                    messageContainers.forEach(container => {
                        createCopyButton(container.parentElement);
                    });
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeMessages);
} else {
    observeMessages();
}

// Handle existing messages
document.querySelectorAll('.model-prompt-container').forEach(container => {
    createCopyButton(container.parentElement);
});