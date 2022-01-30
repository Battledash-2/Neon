const esc = [
    [/\\n/, "\n"],
    [/\\e/, "\e"],

    [/\\("|')/, "$1"],

    [/\\\\/, "\\"],
];

module.exports = str => {
    for (let [ rgx, rp ] of esc) {
        rgx = new RegExp("(?<!\\\\)"+rgx.source, 'g');
        str = str.replace(rgx, rp);
    }

    return str;
}