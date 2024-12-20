# Gemini Copy Button Mover

This browser extension moves the "Copy" button to next to the "Like" and "Dislike" buttons on Google AI Studio, providing a more convenient way to copy generated responses.

## Features

-   **Moves the copy button:** Repositions the copy button for better accessibility.
-   **Copies formatted content:** Preserves markdown formatting (headers, code blocks, lists, etc.) when copying.
-   **Easy to use:** Automatically works on the Google AI Studio website without any manual steps.

## Installation

1. Clone or download this repository.
2. Open your browser's extension settings:
    -   Chrome: Go to `chrome://extensions/`
    -   Firefox: Go to `about:addons`
    -   Edge: Go to `edge://extensions/`
3. Enable "Developer mode" (usually a toggle in the top right corner).
4. Click "Load unpacked" (Chrome/Edge) or "Load Temporary Add-on" (Firefox).
5. Select the `gemini-copy-button` directory where you downloaded the extension files.

## Usage

1. Go to [https://aistudio.google.com/](https://aistudio.google.com/).
2. Use the AI as you normally would.
3. When you generate a response you want to copy, you'll see a new "Copy Response" button next to the "Like" and "Dislike" buttons.
4. Click the "Copy Response" button to copy the formatted content to your clipboard.

## How it works

The extension uses a content script that runs on the Google AI Studio website. It observes changes to the page and adds a custom "Copy Response" button to each assistant message. When clicked, the button extracts the formatted content from the message and copies it to the clipboard.

## Disclaimer

Please use this code with caution and be aware of the potential risks associated with using third-party browser extensions. The developer of this extension is not responsible for any damages or issues that may arise from its use.

## Acknowledgments

This extension was created to enhance the user experience of Google AI Studio.
