const spec = [
	// ---------------------------
	// Gone
	[/^\/\/.*|^\/\*[\s]+?\*\//, null],
	[/^\s+/, null],

	// ---------------------------
	// Math
	[/^(==|<=|>=|<|>|!=|\|\||&&)/, "CONDITION_OPERATOR"],
	[/^(\+\+|\-\-)/, "ASSIGNMENT_SS"],
	[/^(\+=|\-=|\*=|=)/, "ASSIGNMENT"],
	[/^[\+\-\*\/\^\!]/, "OPERATOR"],

	[/^\(/, 'LPAREN'],
	[/^\)/, 'RPAREN'],
	
	[/^\{/, 'LBLOCK'],
	[/^\}/, 'RBLOCK'],

	[/^\[/, 'LBRACK'],
	[/^\]/, 'RBRACK'],

	[/^\.?\d+\.?\d*\b/, "NUMBER"],
	
	// ---------------------------
	// Keywords
	// -- Variables:
	[/^if\b/, "CONDITIONAL"],
	[/^else\b/, "CONDITIONAL_ELSE"],

	[/^(var|let|const)\b/, "DEFINE"],
	[/^(for|while)\b/, "LOOP"],

	[/^break\b/, "BREAK"],

	[/^\bimport\b/, "IMPORT"],
	[/^\bexport\b/, "EXPORT"],

	[/^\bfun\b/, "F_DEFINE"],
	
	[/^\bclass\b/, "C_DEFINE"],
	[/^\bnew\b/, "C_CREATE"],
	
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
	constructor(source, filename='runtime') {
		this.source = source;
		this.cursor = 0;

		// for error logging
		this.line = 0;
		this.pos = 1;
		this.filename = filename;
	}
	
	reachedEof() {
		return this.cursor >= this.source.length;
	}

	isAdditive(tok) {
		return tok === '+' || tok === '-' || tok === '!';
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
		this.pos += match[0].length;

		return match[0];
	}

	nextToken() {
		if (this.reachedEof()) return null;

		const string = this.source.slice(this.cursor);
		for (let [ rgx, type ] of spec) {
			const match = this.match(rgx, string);

			if (match == null) continue;
			switch (type) {
				case null:
					let newlines = match.match(/\n+/g);
					this.line += newlines?.length ?? 0;
					this.pos = newlines?.length > 0 ? 1 : this.pos;

					return this.nextToken();			
			}

			return {
				type,
				value: match,
				position: {
					line: this.line,
					cursor: this.pos - match.length,
				}
			}
		}

		throw new SyntaxError(`Unexpected token '${string.slice(0, 1)}' (${this.filename}:${this.line}:${this.cursor})`);
	}
}