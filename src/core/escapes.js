const esc = [
	[/\\n/, "\n"],
	[/\\e/, "\u001b"],

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