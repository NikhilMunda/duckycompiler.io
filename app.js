// Ducky Script Compiler & Payload Generator

// Application state
let editor = null;
let isCompiling = false;
let lastCompilationResult = null;

// Ducky script data
const DUCKY_COMMANDS = [
    "STRING", "STRINGLN", "DELAY", "ENTER", "TAB", "SPACE", "BACKSPACE",
    "GUI", "ALT", "CTRL", "SHIFT", "ESC", "DELETE", "HOME", "END",
    "PAGEUP", "PAGEDOWN", "UP", "DOWN", "LEFT", "RIGHT",
    "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
    "MOUSE_CLICK", "MOUSE_MOVE", "MOUSE_SCROLL", "MOUSE_PRESS", "MOUSE_RELEASE",
    "JIGGLE_MOUSE", "BACKGROUND_JIGGLE_MOUSE",
    "HOLD", "RELEASE", "RELEASE_ALL",
    "VAR", "DEFINE", "FUNCTION", "END_FUNCTION",
    "IF", "ELSE", "END_IF", "WHILE", "END_WHILE",
    "STRING_BLOCK", "END_STRING", "STRINGLN_BLOCK", "END_STRINGLN",
    "REM", "REM_BLOCK", "END_REM",
    "IMPORT", "REPEAT", "SELECT_LAYOUT",
    "RESTART_PAYLOAD", "STOP_PAYLOAD", "PRINT"
];

const MOUSE_BUTTONS = ["LEFT", "RIGHT", "MIDDLE"];
const LAYOUTS = ["US", "US_DVO", "WIN_FR", "WIN_DE", "WIN_ES", "WIN_IT", "MAC_FR"];
const INTERNAL_VARIABLES = ["$_CAPSLOCK_ON", "$_NUMLOCK_ON", "$_SCROLLLOCK_ON", "$_BSSID", "$_SSID", "$_PASSWD"];
const RANDOM_VARIABLES = ["$_RANDOM_INT", "$_RANDOM_NUMBER", "$_RANDOM_LOWERCASE_LETTER", "$_RANDOM_UPPERCASE_LETTER", "$_RANDOM_LETTER", "$_RANDOM_SPECIAL", "$_RANDOM_CHAR"];

// Sample Ducky script
const SAMPLE_SCRIPT = `REM Advanced Ducky Script Example
REM This demonstrates compiler features

VAR $username = "admin"
VAR $delay_time = 500

DEFINE FAST_TYPE 50  REM THIS CODE IS WRONG! CORRECT IT

FUNCTION open_notepad
  GUI r
  DELAY $delay_time
  STRING notepad
  ENTER
  DELAY 1000
END_FUNCTION

IF $_CAPSLOCK_ON == 1
  CAPSLOCK REM THIS CODE IS WRONG! CORRECT IT
END_IF

open_notepad

STRING_BLOCK
Hello, this is a test
Written by: $username
Current delay: $delay_time ms
END_STRING

STRINGLN
DELAY FAST_TYPE REM THIS CODE IS WRONG! CORRECT IT
STRING This line has a fast delay

MOUSE_MOVE 100 100
MOUSE_CLICK LEFT
DELAY 500

WHILE $delay_time > 100
  DELAY $delay_time
  $delay_time = $delay_time - 100
END_WHILE

REM_BLOCK
This is a block comment
Multiple lines can go here
END_REM`;

// DOM elements
let compileBtn, generateBtn, clearConsoleBtn, clearBtn, loadExampleBtn;
let consoleOutput, consoleStats, statusDot, statusText, loadingOverlay;

// Initialize application
function init() {
    // Get DOM elements
    compileBtn = document.getElementById('compileBtn');
    generateBtn = document.getElementById('generateBtn');
    clearConsoleBtn = document.getElementById('clearConsoleBtn');
    clearBtn = document.getElementById('clearBtn');
    loadExampleBtn = document.getElementById('loadExampleBtn');
    consoleOutput = document.getElementById('consoleOutput');
    consoleStats = document.getElementById('consoleStats');
    statusDot = document.getElementById('statusDot');
    statusText = document.getElementById('statusText');
    loadingOverlay = document.getElementById('loadingOverlay');

    // Ensure loading overlay is hidden initially
    loadingOverlay.classList.add('hidden');

    // Setup event listeners
    setupEventListeners();

    // Initialize Monaco Editor
    initializeMonacoEditor();
    
    // Set initial status
    updateStatus('success', 'Ready');
}

function setupEventListeners() {
    compileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        compileScript();
    });
    
    generateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        generatePayload();
    });
    
    clearConsoleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearConsole();
    });
    
    clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearEditor();
    });
    
    loadExampleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        loadExample();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            compileScript();
        }
        
        // Allow ESC to close loading overlay if needed
        if (e.key === 'Escape' && !loadingOverlay.classList.contains('hidden')) {
            hideLoading();
        }
    });
}

function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function initializeMonacoEditor() {
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } });

    require(['vs/editor/editor.main'], function () {
        // Register Ducky Script language
        monaco.languages.register({ id: 'ducky' });

        // Define Ducky Script syntax highlighting
        monaco.languages.setMonarchTokensProvider('ducky', {
            tokenizer: {
                root: [
                    // Comments
                    [/^REM.*$/, 'comment'],
                    [/REM_BLOCK/, 'comment.block.begin'],
                    [/END_REM/, 'comment.block.end'],
                    
                    // Commands
                    [new RegExp(`\\b(${DUCKY_COMMANDS.join('|')})\\b`), 'keyword'],
                    
                    // Variables and defines
                    [/\$[a-zA-Z_][a-zA-Z0-9_]*/, 'variable'],
                    [/\$_[A-Z_]+/, 'variable.predefined'],
                    
                    // Strings
                    [/".*?"/, 'string'],
                    [/'.*?'/, 'string'],
                    
                    // Numbers
                    [/\b\d+\b/, 'number'],
                    
                    // Operators
                    [/[=<>!]+/, 'operator'],
                    [/[+\-*/]/, 'operator'],
                    
                    // Mouse buttons and layouts
                    [new RegExp(`\\b(${MOUSE_BUTTONS.join('|')})\\b`), 'constant'],
                    [new RegExp(`\\b(${LAYOUTS.join('|')})\\b`), 'constant'],
                ]
            }
        });

        // Create the editor
        editor = monaco.editor.create(document.getElementById('editorContainer'), {
            value: SAMPLE_SCRIPT,
            language: 'ducky',
            theme: 'vs-dark',
            fontSize: 14,
            fontFamily: 'Consolas, Monaco, Courier New, monospace',
            lineNumbers: 'on',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            bracketMatching: 'always',
            folding: true,
            renderLineHighlight: 'line',
            cursorBlinking: 'blink'
        });

        // Auto-completion provider
        monaco.languages.registerCompletionItemProvider('ducky', {
            provideCompletionItems: function(model, position) {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };

                const suggestions = [
                    ...DUCKY_COMMANDS.map(cmd => ({
                        label: cmd,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: cmd,
                        range: range,
                        documentation: `Ducky Script command: ${cmd}`
                    })),
                    ...MOUSE_BUTTONS.map(btn => ({
                        label: btn,
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: btn,
                        range: range,
                        documentation: `Mouse button: ${btn}`
                    })),
                    ...LAYOUTS.map(layout => ({
                        label: layout,
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: layout,
                        range: range,
                        documentation: `Keyboard layout: ${layout}`
                    })),
                    ...INTERNAL_VARIABLES.map(variable => ({
                        label: variable,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: variable,
                        range: range,
                        documentation: `Internal variable: ${variable}`
                    })),
                    ...RANDOM_VARIABLES.map(variable => ({
                        label: variable,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: variable,
                        range: range,
                        documentation: `Random variable: ${variable}`
                    }))
                ];

                return { suggestions: suggestions };
            }
        });

        // Real-time validation (debounced)
        let validationTimeout;
        editor.onDidChangeModelContent(() => {
            clearTimeout(validationTimeout);
            validationTimeout = setTimeout(() => {
                validateScriptRealtime();
            }, 500);
        });

        addConsoleMessage('success', 'Monaco Editor initialized successfully. Ready to compile Ducky scripts.');
        updateStats(editor.getModel().getLineCount(), 0, 0);
    });
}

function validateScriptRealtime() {
    if (!editor) return;
    
    const code = editor.getValue();
    const lines = code.split('\n');
    const markers = [];
    
    let lineNumber = 1;
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('REM') && !isInCommentBlock(lines, lineNumber - 1)) {
            const error = validateLine(trimmed, lineNumber);
            if (error) {
                markers.push({
                    severity: monaco.MarkerSeverity.Error,
                    startLineNumber: lineNumber,
                    startColumn: 1,
                    endLineNumber: lineNumber,
                    endColumn: line.length + 1,
                    message: error
                });
            }
        }
        lineNumber++;
    }
    
    monaco.editor.setModelMarkers(editor.getModel(), 'ducky-validation', markers);
}

function isInCommentBlock(lines, lineIndex) {
    let inBlock = false;
    for (let i = 0; i <= lineIndex; i++) {
        const line = lines[i].trim();
        if (line === 'REM_BLOCK') inBlock = true;
        if (line === 'END_REM') inBlock = false;
    }
    return inBlock;
}

function validateLine(line, lineNumber) {
    // Basic command validation
    const parts = line.split(/\s+/);
    const command = parts[0];
    
    if (!DUCKY_COMMANDS.includes(command) && !command.startsWith('$') && !isUserDefinedFunction(command)) {
        return `Unknown command: ${command}`;
    }
    
    // Specific validations
    switch (command) {
        case 'DELAY':
            if (parts.length < 2) return 'DELAY command requires a numeric value';
            if (parts.length > 1 && !parts[1].startsWith('$') && isNaN(parseInt(parts[1]))) {
                return 'DELAY value must be numeric or a variable';
            }
            break;
            
        case 'MOUSE_CLICK':
            if (parts.length < 2) return 'MOUSE_CLICK requires a button parameter';
            if (!MOUSE_BUTTONS.includes(parts[1]) && !parts[1].startsWith('$')) {
                return `Invalid mouse button. Use: ${MOUSE_BUTTONS.join(', ')}`;
            }
            break;
            
        case 'MOUSE_MOVE':
            if (parts.length < 3) return 'MOUSE_MOVE requires X and Y coordinates';
            break;
            
        case 'VAR':
            if (parts.length < 4 || parts[2] !== '=') {
                return 'VAR syntax: VAR $name = value';
            }
            if (!parts[1].startsWith('$')) {
                return 'Variable names must start with $';
            }
            break;
            
        case 'SELECT_LAYOUT':
            if (parts.length < 2) return 'SELECT_LAYOUT requires a layout parameter';
            if (!LAYOUTS.includes(parts[1])) {
                return `Invalid layout. Use: ${LAYOUTS.join(', ')}`;
            }
            break;
    }
    
    return null;
}

function isUserDefinedFunction(name) {
    if (!editor) return false;
    // Check if it's a user-defined function (simplified check)
    const code = editor.getValue();
    const functionRegex = new RegExp(`FUNCTION\\s+${name}`, 'i');
    return functionRegex.test(code);
}

async function compileScript() {
    if (isCompiling || !editor) return;
    
    isCompiling = true;
    updateStatus('compiling', 'Compiling...');
    compileBtn.classList.add('btn--loading');
    compileBtn.disabled = true;
    generateBtn.disabled = true;
    
    // Show loading overlay
    showLoading();
    
    try {
        const code = editor.getValue();
        addConsoleMessage('info', 'Starting compilation...');
        
        // Simulate compilation delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const result = await performCompilation(code);
        
        if (result.success) {
            addConsoleMessage('success', `Compilation successful! ${result.stats.lines} lines processed, ${result.stats.variables} variables, ${result.stats.functions} functions.`);
            updateStatus('success', 'Compilation Success');
            generateBtn.disabled = false;
            lastCompilationResult = result;
        } else {
            addConsoleMessage('error', `Compilation failed with ${result.errors.length} error(s)`);
            result.errors.forEach(error => {
                addConsoleMessage('error', `Line ${error.line}: ${error.message}`);
            });
            updateStatus('error', 'Compilation Failed');
        }
        
        updateStats(result.stats.lines, result.stats.variables, result.stats.functions);
        
    } catch (error) {
        addConsoleMessage('error', `Compilation error: ${error.message}`);
        updateStatus('error', 'Compilation Error');
    } finally {
        isCompiling = false;
        compileBtn.classList.remove('btn--loading');
        compileBtn.disabled = false;
        hideLoading();
    }
}

async function performCompilation(code) {
    const lines = code.split('\n');
    const errors = [];
    const variables = new Set();
    const functions = new Set();
    let blockStack = [];
    
    let lineNumber = 1;
    let inCommentBlock = false;
    let inStringBlock = false;
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines
        if (!trimmed) {
            lineNumber++;
            continue;
        }
        
        // Handle comment blocks
        if (trimmed === 'REM_BLOCK') {
            inCommentBlock = true;
            blockStack.push({ type: 'REM_BLOCK', line: lineNumber });
        } else if (trimmed === 'END_REM') {
            if (!inCommentBlock) {
                errors.push({ line: lineNumber, message: 'END_REM without matching REM_BLOCK' });
            }
            inCommentBlock = false;
            blockStack.pop();
        } else if (inCommentBlock) {
            // Skip lines inside comment blocks
            lineNumber++;
            continue;
        }
        
        // Handle string blocks
        if (trimmed === 'STRING_BLOCK' || trimmed === 'STRINGLN_BLOCK') {
            inStringBlock = true;
            blockStack.push({ type: trimmed, line: lineNumber });
        } else if (trimmed === 'END_STRING' || trimmed === 'END_STRINGLN') {
            if (!inStringBlock) {
                errors.push({ line: lineNumber, message: `${trimmed} without matching string block` });
            }
            inStringBlock = false;
            blockStack.pop();
        } else if (inStringBlock) {
            // Skip validation inside string blocks
            lineNumber++;
            continue;
        }
        
        // Skip single-line comments
        if (trimmed.startsWith('REM ')) {
            lineNumber++;
            continue;
        }
        
        // Validate line
        const error = validateLine(trimmed, lineNumber);
        if (error) {
            errors.push({ line: lineNumber, message: error });
        }
        
        // Track variables and functions
        const parts = trimmed.split(/\s+/);
        if (parts[0] === 'VAR' && parts.length >= 2) {
            variables.add(parts[1]);
        }
        if (parts[0] === 'FUNCTION' && parts.length >= 2) {
            functions.add(parts[1]);
            blockStack.push({ type: 'FUNCTION', line: lineNumber, name: parts[1] });
        }
        if (parts[0] === 'END_FUNCTION') {
            const lastBlock = blockStack[blockStack.length - 1];
            if (!lastBlock || lastBlock.type !== 'FUNCTION') {
                errors.push({ line: lineNumber, message: 'END_FUNCTION without matching FUNCTION' });
            } else {
                blockStack.pop();
            }
        }
        
        // Handle other block structures
        if (['IF', 'WHILE'].includes(parts[0])) {
            blockStack.push({ type: parts[0], line: lineNumber });
        }
        if (['END_IF', 'END_WHILE'].includes(parts[0])) {
            const expectedType = parts[0].replace('END_', '');
            const lastBlock = blockStack[blockStack.length - 1];
            if (!lastBlock || lastBlock.type !== expectedType) {
                errors.push({ line: lineNumber, message: `${parts[0]} without matching ${expectedType}` });
            } else {
                blockStack.pop();
            }
        }
        
        lineNumber++;
    }
    
    // Check for unclosed blocks
    blockStack.forEach(block => {
        errors.push({ line: block.line, message: `Unclosed ${block.type} block` });
    });
    
    // In your performCompilation function's return statement:
    return {
         success: errors.length === 0,
         errors: errors,
         stats: {
             lines: lines.length,
             variables: variables.size,
             functions: functions.size
         },
         compiledCode: code,        // Original input code
         processedCode: code        // For now, same as input - can be enhanced later
     };

}

function generatePayload() {
    if (!lastCompilationResult || !lastCompilationResult.success) {
        addConsoleMessage('error', 'Cannot generate payload: No successful compilation result available');
        return;
    }
    
    addConsoleMessage('info', 'Generating payload.oqs file...');
    
    // Use the compiled and verified code (plain text, not base64)
    const compiledCode = lastCompilationResult.processedCode || lastCompilationResult.compiledCode;
    
    // Create blob with plain text MIME type
    const blob = new Blob([compiledCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create download link with correct filename
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payload.oqs'; // Correct extension
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addConsoleMessage('success', 'payload.oqs file generated and downloaded successfully!');
    addConsoleMessage('info', `File contains ${compiledCode.split('\n').length} lines of verified Ducky script code`);
}

function updateButtonStates() {
    if (lastCompilationResult && lastCompilationResult.success) {
        generateBtn.disabled = false;
        // Update button text to show it's ready
        generateBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Generate payload.oqs
        `;
    } else {
        generateBtn.disabled = true;
    }
}



function updateStatus(type, text) {
    statusDot.className = `status-dot ${type}`;
    statusText.textContent = text;
}

function addConsoleMessage(type, message, lineNumber = null) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const messageDiv = document.createElement('div');
    messageDiv.className = `console-message ${type}`;
    
    let messageText = message;
    if (lineNumber) {
        messageText = `Line ${lineNumber}: ${message}`;
    }
    
    messageDiv.innerHTML = `
        <span class="message-time">[${time}]</span>
        <span class="message-text">${messageText}</span>
    `;
    
    consoleOutput.appendChild(messageDiv);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function clearConsole() {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    consoleOutput.innerHTML = `<div class="console-message info"><span class="message-time">[${time}]</span><span class="message-text">Console cleared.</span></div>`;
}

function clearEditor() {
    if (editor) {
        editor.setValue('');
        addConsoleMessage('info', 'Editor cleared.');
        updateStats(0, 0, 0);
        generateBtn.disabled = true;
        lastCompilationResult = null;
        updateStatus('success', 'Ready');
    }
}

function loadExample() {
    if (editor) {
        editor.setValue(SAMPLE_SCRIPT);
        addConsoleMessage('info', 'Sample script loaded.');
        updateStats(SAMPLE_SCRIPT.split('\n').length, 2, 1);
        generateBtn.disabled = true;
        lastCompilationResult = null;
        updateStatus('success', 'Ready');
    }
}

function updateStats(lines, variables, functions) {
    consoleStats.textContent = `${lines} lines processed, ${variables} variables, ${functions} functions`;
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
