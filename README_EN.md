# Free Translation Tool

## Overview

A free translation tool that allows users to translate text between multiple languages using several free translation services. The tool is designed with an easy-to-use interface and supports right-to-left text direction for Arabic, with automatic language detection and the ability to translate to multiple languages simultaneously.

## Features

- Automatic language detection for input text
- Translation between multiple languages (Arabic, English, French, Spanish, German, Italian, Russian, Chinese, Japanese, Korean, Turkish, Hindi, Portuguese, Albanian)
- Ability to translate to multiple target languages simultaneously
- Support for multiple free translation services:
  - Google Translate
  - MyMemory Translation
  - Microsoft Translator
  - DeepL Translator
- Option to compare translation results from all services at once
- One-click language swapping
- Copy translated text to clipboard
- Auto-translation as you type
- Responsive design that works on all devices
- Full support for Arabic and right-to-left text direction
- Bilingual interface available in both Arabic and English

## How to Use

1. Make sure your XAMPP server is running
2. Open a web browser and navigate to: `http://localhost/translator/` or `http://localhost/translator/index_en.html` for the English interface
3. Enter the text you want to translate in the left text box
4. Choose the source language (or use auto-detect) and target language(s) from the dropdown menus
   - You can select multiple target languages by holding the Ctrl key while selecting
5. Choose your preferred translation service or select "All Services" to compare results
6. Click the "Translate" button or wait for auto-translation

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Translation APIs:
  - Google Translate API (via free proxy)
  - MyMemory Translation API
  - Microsoft Translator API (simulated)
  - DeepL API (simulated)

## Project Structure

```
translator/
├── index.html         # Main HTML file with Arabic interface
├── index_en.html      # English version of the interface
├── style.css          # CSS styling file
├── script.js          # JavaScript for translation functionality
├── README.md          # Documentation in Arabic
└── README_EN.md       # Documentation in English
```

## Notes

- This tool was created for educational purposes only
- The tool uses free translation APIs, which may have request limits
- No API keys are required to use this tool, as it's configured to use free endpoints
- Microsoft Translator and DeepL implementations are simulated for demonstration purposes

## Contributing

Contributions and suggestions to improve this tool are welcome. You can:
- Suggest new features
- Report bugs
- Improve the user interface
- Add additional translation services

## License

This project is available under the MIT License. See the LICENSE file for details.