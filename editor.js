class Editor {
    constructor(file = "Unnamed File") {
        this.file = file;
        this.modified = false;
    }

    draw(x, y, w, h) {
        process.stdout.write(`\x1b[${y + 1};${x + 1}HHello world!`);
    }
    handleKeyPress(str, key, x, y, w, h) {}
    saveAction() {}
    close() {return !this.modified;}
}

exports.Editor = Editor;