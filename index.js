#!/usr/bin/env node
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const Layout = {
    Editors: {},
    EditorsList: {
        Width: 25
    },
    Console: {
        Height: 10
    }
};
const EditorTypes = {};
(function() {
    const TextEditor = require("./editors/texteditor").TextEditor;
    const DirectoryEditor = require("./editors/directoryeditor").DirectoryEditor;
    EditorTypes["default"] = (path) => {return new TextEditor(path)};
    EditorTypes["directory"] = (path) => {return new DirectoryEditor(path)};
})();
const FileTypes = {
    "txt": "default"
};
function getEditorType(filename) {
    if (fs.statSync(filename).isDirectory()) return "directory";
    const arr = filename.split(".");
    const type = arr[arr.length - 1];
    return (FileTypes[type]? FileTypes[type] : "default");
}
const TTYWidth = process.stdout.columns || 80;
const TTYHeight = process.stdout.rows || 25;
var editors = [];
var selected = -1;

function maxWidth(str, width) {
    width -= str.length;
    while (width > 0) {
        str += " ";
        width--;
    }
    return str;
}
function spaces(amount) {
    var o = "";
    while (amount > 0) {o += " "; amount--;}
    return o;
}
function renderEditorsList() {
    if (editors.length === 0) {
        process.stdout.write(`\x1b[1;1H\x1b[90m(no opened editor)\x1b[0m`);
        process.stdout.write(`\n\x1b[90m * Ctrl + N to create\x1b[0m`);
    } else for (var i = 0; i < editors.length; i++) {
        if (i === selected) process.stdout.write(`\x1b[7m\x1b[${i + 1};1H   ${maxWidth((editors[i].modified? "*" : "") + path.basename(editors[i].file).substr(0, Layout.EditorsList.Width - 4), Layout.EditorsList.Width - 3)}\x1b[0m`);
        else process.stdout.write(`\x1b[${i + 1};1H   ${maxWidth((editors[i].modified? "*" : "") + path.basename(editors[i].file).substr(0, Layout.EditorsList.Width - 4), Layout.EditorsList.Width - 3)}`);
    }
}

var Con = {
    display: ["\x1b[94mberp by nahkd123\x1b[0m - \x1b[4mgithub.com/nahkd123", "Type 'help' for help"],
    scrollY: 0,
    cursorX: 0,
    command: "",
    pop: false
};
function processCommand(cmd) {
    Con.display.push(`\x1b[97m\x1b[4m> ${cmd}\x1b[0m`);
    if (cmd === "help") {
        Con.display.push("\x1b[94mexit | quit | bye            \x1b[0m Exit berp");
        Con.display.push("\x1b[94mopen | new                   \x1b[0m Open or create new file");
        Con.display.push("\x1b[94mclose \x1b[90m(Ctrl + W)             \x1b[0m Close editor");
        Con.display.push("\x1b[94m!close                       \x1b[0m Force to close editor");
        Con.display.push("\x1b[90mType 'help kb' for keyboard shortcuts\x1b[0m");
    } else if (cmd === "help kb") {
        Con.display.push("\x1b[94m(Ctrl + W)                   \x1b[0m Close editor");
        Con.display.push("\x1b[94m(Ctrl + S)                   \x1b[0m Save file");
        Con.display.push("\x1b[94m(Alt + Up/Down)              \x1b[0m Switch editor");
    } else if (cmd.startsWith("open ") || cmd.startsWith("new ")) {
        const name = cmd.substr(4).trim();
        selected = editors.push(EditorTypes[getEditorType(name)](name)) - 1;
        Con.pop = false;
        process.stdout.write("\x1b[2J\x1b[0;0H");
    } else if (cmd === "exit" || cmd === "quit" || cmd === "bye") {
        process.stdout.write("\x1b[?1049l");
        process.exit();
    } else if (cmd.startsWith("!")) {
        const envcmd = cmd.substr(1);
        // TODO exec(envcmd)
    }
}
function renderConsole() {
    if (Con.pop) {
        process.stdout.write(`\x1b[${TTYHeight - Layout.Console.Height};${Layout.EditorsList.Width + 1}H\x1b[7m   ${maxWidth("Console", TTYWidth - Layout.EditorsList.Width - 17)}   Ctrl + T   \x1b[0m`);
    } else process.stdout.write(`\x1b[${TTYHeight};${Layout.EditorsList.Width + 1}H\x1b[7m   ${maxWidth("Console", TTYWidth - Layout.EditorsList.Width - 17)}   Ctrl + T   \x1b[0m`);
}
function postRenderConsole() {
    while (Con.display.length > Layout.Console.Height - 1) Con.display.shift();
    for (var i = 0; i < Layout.Console.Height - 1; i++) {
        if (Con.display[i]) process.stdout.write(`\x1b[${TTYHeight - Layout.Console.Height + i + 1};${Layout.EditorsList.Width + 3}H${spaces(TTYWidth - Layout.EditorsList.Width - 3)}\x1b[${TTYHeight - Layout.Console.Height + i + 1};${Layout.EditorsList.Width + 3}H${Con.display[i]}\x1b[0m`);
    }
    process.stdout.write(`\x1b[${TTYHeight};${Layout.EditorsList.Width + 3}H${spaces(TTYWidth - Layout.EditorsList.Width - 3)}\x1b[${TTYHeight};${Layout.EditorsList.Width + 1}H> ${Con.command}\x1b[${TTYHeight};${Layout.EditorsList.Width + Con.cursorX + 3}H`);
}
function consoleKeyHandler(str, key) {
    if (key.name === "left") {
        if (Con.cursorX > 0) Con.cursorX--;
    } else if (key.name === "right") {
        if (Con.cursorX < Con.command.length) Con.cursorX++;
    }
    else if (key.name === "home") Con.cursorX = 0;
    else if (key.name === "end") Con.cursorX = Con.command.length;
    else if (key.name === "backspace") {
        if (Con.cursorX > 0) {
            Con.command = Con.command.substr(0, Con.cursorX - 1) + Con.command.substr(Con.cursorX);
            Con.cursorX--;
        }
    } else if (key.name === "return") {
        processCommand(Con.command);
        Con.command = "";
        Con.cursorX = 0;
    } else {
        Con.command = Con.command.substr(0, Con.cursorX) + str + Con.command.substr(Con.cursorX);
        Con.cursorX += str.length;
    }
}

// TODO Optimize drawing (like prevent from clearing screen too much)
function render() {
    process.stdout.write("\x1b[?25l");
    // process.stdout.write("\x1b[2J\x1b[0;0H");
    renderEditorsList();
    renderConsole();
    if (selected !== -1) editors[selected].draw(Layout.EditorsList.Width + 1, 0, TTYWidth - Layout.EditorsList.Width - 1, TTYHeight - (Con.pop? Layout.Console.Height + 1 : 1));
    if (Con.pop) postRenderConsole();
    process.stdout.write("\x1b[?25h");
}

const InternalFunctions = {
    processCommand: processCommand
};

process.stdout.write("\x1b[?1049h\x1b[5 q");
render();
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.on("keypress", (str, key) => {
    if (key.name === "c" && key.ctrl) {
        // Copy
        if (selected === -1) {
            Con.display.push("\x1b[90mCtrl + C is binded to Copy command\x1b[0m");
            Con.display.push("\x1b[90mTo exit berp, open console and type 'exit'\x1b[0m");
            if (!Con.pop) {
                process.stdout.write("\x1b[2J\x1b[0;0H");
                Con.pop = true;
            }
            render();
        }
    } else if (key.name === "w" && key.ctrl) {
        if (Con.pop) {
            Con.pop = false;
            process.stdout.write("\x1b[2J\x1b[0;0H");
            render();
        } else if (selected !== -1) {
            if (editors[selected].close()) {
                Con.display.push(`\x1b[90mClosed '${editors[selected].file}'\x1b[0m`);
                editors.splice(selected, 1);
                selected = editors.length - 1;
                process.stdout.write("\x1b[2J\x1b[0;0H");
                render();
            } else {
                Con.display.push(`\x1b[91mCouldn't close '${editors[selected].file}'\x1b[0m`);
                Con.display.push(`\x1b[90mForce close by typing '!close ${editors[selected].file}'\x1b[0m`);
                if (!Con.pop) {
                    // TODO Only redraw bottom section/Console
                    process.stdout.write("\x1b[2J\x1b[0;0H");
                    Con.pop = true;
                }
                render();
            }
        }
    } else if (key.sequence === "\x1b\x1b[A" && selected > 0) {
        selected--;
        process.stdout.write("\x1b[2J\x1b[0;0H");
        render();
    } else if (key.sequence === "\x1b\x1b[B" && selected < editors.length - 1) {
        selected++;
        process.stdout.write("\x1b[2J\x1b[0;0H");
        render();
    } else if (key.name === "s" && key.ctrl && selected !== -1) {
        editors[selected].saveAction();
        Con.display.push(`\x1b[90mSaved '${editors[selected].file}'\x1b[0m`);
        if (Con.pop) {
            process.stdout.write("\x1b[2J\x1b[0;0H");
        }
        render();
    } else if (key.name === "t" && key.ctrl) {
        Con.pop = !Con.pop;
        process.stdout.write("\x1b[2J\x1b[0;0H");
        render();
    } else if (key.name === "n" && key.ctrl) {
        Con.pop = true;
        Con.display.push("\x1b[90mType 'open <File Name>' to create new file\x1b[0m");
        Con.command = "open ";
        Con.cursorX = 5;
        render();
    } else if (selected !== -1) {
        if (!Con.pop) editors[selected].handleKeyPress(str, key, Layout.EditorsList.Width + 1, 0, TTYWidth - Layout.EditorsList.Width - 1, TTYHeight - (Con.pop? Layout.Console.Height + 1 : 1), InternalFunctions);
        else consoleKeyHandler(str, key);
        render();
    } else {
        if (!Con.pop) {
            Con.pop = !Con.pop;
            process.stdout.write("\x1b[2J\x1b[0;0H");
        }
        consoleKeyHandler(str, key);
        render();
    }
});