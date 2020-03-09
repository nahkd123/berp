const {Editor} = require("../editor");
const fs = require("fs");

function fillWidthBefore(str, width) {
    width -= str.length;
    while (width > 0) {
        str = " " + str;
        width--;
    }
    return str;
}
function spaces(amount) {
    var o = "";
    while (amount > 0) {o += " "; amount--;}
    return o;
}

class TextEditor extends Editor {
    constructor(file = "Unnamed File") {
        super(file);
        this.lines = [""];
        if (fs.existsSync(file)) {
            this.lines = fs.readFileSync(file, {encoding: "utf-8"}).split("\n");
        }
        this.scroll = { X: 0, Y: 0 };
        this.cursor = { X: 0, Y: 0 };

        this.redrawLine = -1;
        this.redrawAll = false;
    }

    draw(x, y, w, h) {
        const cache_Spaces = spaces(w);
        if (this.redrawAll) {
            for (var xx = 0; xx < h; xx++) process.stdout.write(`\x1b[${y + xx + 1};${x + 1}H` + cache_Spaces);
            this.redrawAll = false;
        }
        for (var i = 0; i < h; i++) {
            const line = this.lines[i + this.scroll.Y];
            if (this.redrawLine === (i + this.scroll.Y)) {
                process.stdout.write(`\x1b[${y + i + 1};${x + 1}H` + cache_Spaces);
                this.redrawLine = -1;
            }
            if (line !== undefined) {
                process.stdout.write(`\x1b[${y + i + 1};${x + 1}H\x1b[90m${fillWidthBefore(i + this.scroll.Y + 1 + "", 3)} \x1b[0m` + line.substr(this.scroll.X, w - 5));
            }
        }

        process.stdout.write(`\x1b[${this.cursor.Y - this.scroll.Y + 1};${this.cursor.X - this.scroll.X + x + 5}H`);
    }
    handleKeyPress(str, key, x, y, w, h, controller) {
        h--;
        if (key.name === "up") {
            if (this.cursor.Y > 0) {
                this.cursor.Y--;
                if (this.cursor.X >= this.lines[this.cursor.Y].length) this.cursor.X = this.lines[this.cursor.Y].length;
            }
        } else if (key.name === "down") {
            if (this.cursor.Y < this.lines.length - 1) {
                this.cursor.Y++;
                if (this.cursor.X >= this.lines[this.cursor.Y].length) this.cursor.X = this.lines[this.cursor.Y].length;
            }
        } else if (key.name === "left") {
            if (this.cursor.X > 0) {
                this.cursor.X--;
                if (key.ctrl) {
                    var ch;
                    while ((ch = this.lines[this.cursor.Y][this.cursor.X]) !== undefined && ch !== ch.toUpperCase() && this.cursor.X > 0) this.cursor.X--;
                }
            }
        } else if (key.name === "right") {
            if (this.cursor.X < this.lines[this.cursor.Y].length) {
                this.cursor.X++;
                if (key.ctrl) {
                    var ch;
                    while ((ch = this.lines[this.cursor.Y][this.cursor.X]) !== undefined && ch !== ch.toUpperCase() && this.cursor.X < this.lines[this.cursor.Y].length) this.cursor.X++;
                }
            }
        } else if (key.name === "end") this.cursor.X = this.lines[this.cursor.Y].length;
        else if (key.name === "home") this.cursor.X = 0;
        else if (key.name === "backspace") {
            if (this.cursor.X > 0) {
                // BS
                const old = this.lines[this.cursor.Y];
                this.lines[this.cursor.Y] = old.substr(0, this.cursor.X - 1) + old.substr(this.cursor.X);
                this.cursor.X--;
                this.redrawLine = this.cursor.Y;
            } else if (this.cursor.Y > 0) {
                // Remove line
                const old = this.lines[this.cursor.Y];
                this.lines.splice(this.cursor.Y, 1);
                this.cursor.Y--;
                this.cursor.X = this.lines[this.cursor.Y].length;
                this.lines[this.cursor.Y] += old;
                this.redrawAll = true;
            }
        } else if (key.name === "return") {
            const old = this.lines[this.cursor.Y];
            this.lines.splice(this.cursor.Y + 1, 0, old.substr(this.cursor.X));
            this.lines[this.cursor.Y] = old.substr(0, this.cursor.X);
            this.cursor.Y++;
            this.cursor.X = 0;
            this.redrawAll = true;
        } else {
            // Type str
            this.modified = true;
            if (key.name === "tab") str = "    ";
            const old = this.lines[this.cursor.Y];
            this.lines[this.cursor.Y] = old.substr(0, this.cursor.X) + str + old.substr(this.cursor.X);
            this.cursor.X += str.length;
            this.redrawLine = this.cursor.Y;
        }

        if (this.cursor.Y > (this.scroll.Y + h)) {
            this.scroll.Y = this.cursor.Y - h;
            this.redrawAll = true;
        } else if (this.cursor.Y < this.scroll.Y) {
            this.scroll.Y = this.cursor.Y;
            this.redrawAll = true;
        } else if (this.cursor.X > (this.scroll.X + (w - 15))) {
            this.scroll.X = this.cursor.X - (w - 15);
            this.redrawAll = true;
        } else if (this.cursor.X < this.scroll.X) {
            this.scroll.X = this.cursor.X;
            this.redrawAll = true;
        }
    }
    saveAction() {
        var stream = fs.createWriteStream(this.file, {encoding: "utf-8"});
        stream.on("open", () => {
            this.lines.forEach((line, index) => stream.write(line + ((index === this.lines.length - 1)? "" : "\n")));
            stream.close();
        });
        this.modified = false;
    }
}

exports.TextEditor = TextEditor;