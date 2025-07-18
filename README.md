# Gemini (+ AI Studio) Copy Button

This browser extension enhances the user experience on Gemini & Google AI Studio by moving the "Copy" button next to the "Like" and "Dislike" buttons and setting a static placeholder for the input field.

## Features

-   **Moves the copy button:** Repositions the copy button for better accessibility.
-   **Copies formatted content:** Preserves markdown formatting (headers, code blocks, lists, etc.) when copying.
-   **Static Input Placeholder:** Sets a consistent "Type something" placeholder in the main input field, preventing distracting dynamic text.
-   **Easy to use:** Automatically works on the Google Gemini & AI Studio website without any manual steps.

## Installation

1.  Clone or download this repository.
2.  Open your browser's extension settings:
    *   Chrome: Go to `chrome://extensions/`
    *   Firefox: Go to `about:addons`
    *   Edge: Go to `edge://extensions/`
3.  Enable "Developer mode" (usually a toggle in the top right corner).
4.  Click "Load unpacked" (Chrome/Edge) or "Load Temporary Add-on" (Firefox).
5.  Select the directory where you downloaded/cloned the extension files.

## Usage

1.  Go to [https://gemini.google.com/app](https://gemini.google.com/app) or [https://aistudio.google.com/](https://aistudio.google.com/).
2.  Use the AI as you normally would.
3.  The input field will consistently show "Type something" as its placeholder.
4.  When you generate a response you want to copy, you'll see a "Copy Response" button next to the "Like" and "Dislike" buttons.
5.  Click the "Copy Response" button to copy the formatted content to your clipboard.

## How it works

The extension uses a content script that runs on the Google AI Studio website. It observes changes to the page to:
-   Add a custom "Copy Response" button to each assistant message. When clicked, this button extracts the formatted content from the message and copies it to the clipboard.
-   Identify the main input field and set its placeholder text to "Type something", overriding the default dynamic placeholder.

## Disclaimer

Please use this code with caution and be aware of the potential risks associated with using third-party browser extensions. The developer of this extension is not responsible for any damages or issues that may arise from its use.

## Acknowledgments

This extension was created to enhance the user experience of Google AI Studio.
