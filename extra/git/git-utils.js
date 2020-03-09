const fs = require("fs");
const path = require("path");
const gitHeadRegex = /ref: refs\/heads\/([^\n]+)/;

function getBranch(repoPath) {
    if (!fs.existsSync(repoPath) || !fs.existsSync(path.join(repoPath, "./.git/HEAD"))) return null;
    const content = fs.readFileSync(path.join(repoPath, ".git/HEAD"), "utf-8");
    const matches = gitHeadRegex.exec(content);
    return matches? matches[1] : null;
}

exports.getBranch = getBranch;