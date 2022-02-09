const esc = [
	[/\\n/, "\n"],
	[/\\0/, "\u001b"],

	[/\\("|')/, "$1"],

	[/\\u[a-zA-Z0-9]{4}/, match=>String.fromCharCode(parseInt(match.slice('\\u'.length), 16))],
	[/\\x[a-zA-Z0-9]{2}/, match=>String.fromCharCode(parseInt(match.slice('\\x'.length), 16))],

	[/\\\\/, "\\"],
];

module.exports = str => {
	for (let [ rgx, rp ] of esc) {
		rgx = new RegExp("(?<!\\\\)"+rgx.source, 'g');
		str = str.replace(rgx, rp);
	}

	return str;
}