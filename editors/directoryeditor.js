const {Editor} = require("../editor");
const fs = require("fs");
const path = require("path");

function spaces(amount) {
    var o = "";
    while (amount > 0) {o += " "; amount--;}
    return o;
}

class DirectoryEditor extends Editor {
    constructor(file = "./") {
        super(path.join(path.normalize(file), "./"));
        this.files = fs.readdirSync(file);
        this.files.unshift("..");
        this.files.unshift(".");
        this.scrollY = 0;
        this.cursorY = 0;

        this.redrawAll = false;
    }
    draw(x, y, w, h) {
        const cache_Spaces = spaces(w);
        if (this.redrawAll) {
            for (var xx = 0; xx < h; xx++) process.stdout.write(`\x1b[${y + xx + 1};${x + 1}H` + cache_Spaces);
            this.redrawAll = false;
        }

        process.stdout.write(`\x1b[${y + 1};${x + 1}H ${this.file}`);

        for (var i = 0; i < h - 1; i++) if (this.files[i + this.scrollY]) {
            if (this.cursorY === i + this.scrollY) process.stdout.write(`\x1b[${y + i + 2};${x + 1}H\x1b[7m${cache_Spaces}\x1b[${y + i + 2};${x + 1}H ${this.files[i + this.scrollY]}\x1b[0m`);
            else process.stdout.write(`\x1b[${y + i + 2};${x + 1}H${cache_Spaces}\x1b[${y + i + 2};${x + 1}H ${this.files[i + this.scrollY]}`);
        }
        process.stdout.write(`\x1b[${y + this.cursorY - this.scrollY + 2};${x + 1}H`);
    }
    handleKeyPress(str, key, x, y, w, h, controller) {
        h--;
        if (key.name === "up") {
            if (this.cursorY > 0) this.cursorY--;
        } else if (key.name === "down") {
            if (this.cursorY < this.files.length - 1) this.cursorY++;
        } else if (key.name === "return") {
            const filePath = path.join(this.file, this.files[this.cursorY]);
            if (!fs.statSync(filePath).isDirectory()) {
                controller.processCommand("open " + filePath);
            } else {
                this.file = filePath;
                this.files = fs.readdirSync(this.file);
                this.files.unshift("..");
                this.files.unshift(".");
                this.scrollY = 0;
                this.cursorY = 0;
                this.redrawAll = true;
            }
        } else if (key.name === "enter") {
            const filePath = path.join(this.file, this.files[this.cursorY]);
            controller.processCommand("open " + filePath);
        }

        if (this.cursorY > this.scrollY + (h - 1)) {
            this.scrollY = this.cursorY - (h - 1);
            this.redrawAll = true;
        } else if (this.cursorY < this.scrollY) {
            this.scrollY = this.cursorY;
            this.redrawAll = true;
        }
    }
}

exports.DirectoryEditor = DirectoryEditor;