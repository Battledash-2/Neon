const spec = [
	// ---------------------------
	// Gone
	[/^\/\/.*|^\/\*[\s]+?\*\//, null],
	[/^\s+/, null],

	// ---------------------------
	// Math
	[/^[\+\-\*\/\^]/, "OPERATOR"],
	[/^[\=]/, "ASSIGNMENT"],

	[/^\(/, 'LPAREN'],
	[/^\)/, 'RPAREN'],
	
	[/^\{/, 'LBLOCK'],
	[/^\}/, 'RBLOCK'],

	[/^\.?\d+\.?\d*\b/, "NUMBER"],
	
	// ---------------------------
	// Keywords
	// -- Variables:
	[/^(var|let)\b/, "DEFINE"],
	[/^\bfun\b/, "F_DEFINE"],
	
	// ---------------------------
	// Functional
	[/^("|')((?:\\\1|(?:(?!\1).))*)\1/, "STRING"],

	[/^\b[a-zA-Z_]\w*\b/, "IDENTIFIER"],

	[/^,/, 'SEPERATOR'],
	[/^\./, 'OBJ_SEPERATOR'],
	[/^\:/, 'OBJ_SET'],

	// ---------------------------
	// Line ends
	[/^;/, "EXPR_END"],
];

module.exports = class Lexer {
	constructor(source) {
		this.source = source;
		this.cursor = 0;
	}
	
	reachedEof() {
		return this.cursor >= this.source.length;
	}

	isAdditive(tok) {
		return tok === '+' || tok === '-';
	}
	isMultiplicative(tok) {
		return tok === '*' || tok === '/';
	}
	isPower(tok) {
		return tok === '^';
	}

	match(rgx, str) {
		const match = rgx.exec(str);
		
		if (match == null) return null;
		this.cursor += match[0].length;

		return match[0];
	}

	nextToken() {
		if (this.reachedEof()) return null;

		const string = this.source.slice(this.cursor);
		for (let [ rgx, type ] of spec) {
			const match = this.match(rgx, string);

			if (match == null) continue;
			if (type == null) return this.nextToken();


			return {
				type,
				value: match,
			}
		}

		throw new SyntaxError(`Unknown token '${string.slice(0, 1)}'`);
	}
}