# Ducky Script Compiler & Payload Generator

<img width="1872" height="920" alt="image" src="https://github.com/user-attachments/assets/57028f24-0eda-4bb7-bacf-2be18eed2b6a" />

## 🫡 Acknowledgments

This Compiler is made for [VexilonHacker](https://github.com/VexilonHacker/OverQuack) DuckyScripts. I liked his project and thought on making an app to support his library.

## Overview

This project is a powerful web-based Ducky Script compiler and payload generator designed to help penetration testers, hardware hackers, and enthusiasts create, validate, and generate payload files (`payload.oqs`) for Rubber Ducky-like devices.

It provides a professional IDE experience with a rich code editor, real-time syntax checking, advanced validation for Ducky scripting language, and downloadable compiled payload generation — all in a browser.

## Features

- **Monaco-based editor** with syntax highlighting, autocomplete, and error highlighting
- Full **syntax and semantic validation** of Ducky scripting commands and blocks
- Validation of **variables, functions, defines, and block structures**
- Color-coded, user-friendly **console** showing detailed compilation errors and warnings with line numbers
- Real-time **compilation status** and progress indication
- Support for most common Ducky script commands including mouse, keyboard, and control sequences
- Downloadable `.oqs` payload file generation after successful compilation
- Default example script to get started quickly

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- No installation or server backend required — fully client-side!

### Usage

1. Open the web application.
2. Write or paste your Ducky Script code into the editor.
3. Click **Compile & Validate** to check your code.
4. View the console output for errors or success messages.
5. If no errors, click **Generate payload.oqs** to download your compiled payload file.
6. Load this payload onto your target device for execution.

### Keyboard Shortcuts

- `Ctrl + Enter`: Compile the script
- Standard editor shortcuts supported by Monaco

## Example Script

The editor loads a comprehensive sample demonstrating variables, functions, loops, conditionals, mouse & keyboard commands, and comments.

REM Advanced Ducky Script Example

VAR $username = "admin"
VAR $delay_time = 500

DEFINE $FAST_TYPE 50

FUNCTION open_notepad
GUI r
DELAY $delay_time
STRING notepad
ENTER
DELAY 1000
END_FUNCTION

IF $_CAPSLOCK_ON == 1
CAPSLOCK_ON == 0
END_IF

open_notepad

STRING_BLOCK
Hello, this is a test
Written by: $Nikhil
Current delay: $delay_time ms
END_STRING

STRINGLN
DELAY FAST_TYPE
STRING This line has a fast delay

MOUSE_MOVE 100 100
MOUSE_CLICK LEFT
DELAY 500

WHILE $delay_time > 100
DELAY $delay_time
$delay_time = $delay_time - 100
END_WHILE


## Contributing

Contributions are welcome! Please:

- Fork the repository
- Create descriptive pull requests
- Adhere to the code style and include comments
- Report issues or feature requests via GitHub Issues

## License

This project is licensed under the **MIT License**

## Contact

Created and maintained by Nikhil Munda.

For questions, contact: nikhilmunda@gmail.com

---

Made with ❤️ for penetration testers and hardware hackers looking for a powerful, browser-based Ducky script development environment.
