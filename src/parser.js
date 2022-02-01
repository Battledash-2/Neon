const StringHandle = require('./core/escapes');

module.exports = class Parser {
	constructor(tokens, filename='runtime') {
		this.tokens = tokens;
		this.next = this.tokens.nextToken();

		this.filename = filename;

		return this.program();
	}

	stringStatement() {
		let s = this.next;
		s = {
			type: 'STRING',
			value: StringHandle(s.value.slice(1, -1)),
			position: s.position,
		};
		this.advance('STRING');
		if (this.next?.type === 'OBJ_SEPERATOR') {
			return this.linked(s);
		}
		return s;
	}

	numberStatement() {
		let r = this.next;
		r.value = Number(r?.value);
		this.advance('NUMBER');
		if (this.next?.type === 'OBJ_SEPERATOR') {
			return this.linked(r);
		}
		return r;
	}

	unary() {
		let op, num;

		if (this.next?.type === 'OPERATOR' && this.tokens.isAdditive(this.next.value)) {
			op = this.next;
			this.advance('OPERATOR');
			num = this.statement();
		}

		if (op != null) return {
			type: 'UNARY',
			operator: op.value,
			value: num,
			position: op?.position,
		}

		return this.primaryStatement();
	}

	logNoteq() {
		return this._logical('unary', '!=');
	}
	logMEq() {
		return this._logical('logNoteq', '>=');
	}
	logM() {
		return this._logical('logMEq', '>');
	}
	logLEq() {
		return this._logical('logM', '<=');
	}
	logL() {
		return this._logical('logLEq', '<');
	}
	logEqeq() {
		return this._logical('logL', '==');
	}
	logAnd() {
		return this._logical('logEqeq', '&&');
	}
	logOr() {
		return this._logical('logAnd', '||');
	}
	_logical(next, type) {
		let left = this[next]();

		while (this.next?.type === 'CONDITION_OPERATOR' && this.next?.value === type) {
			let operator = this.next.value;
			this.advance('CONDITION_OPERATOR');
			let right = this[next]();

			left = {
				type: 'LOGICAL',
				operator,
				left,
				right,
				position: left?.position,
			}
		}

		return left;
	}

	logicalExpression() {
		return this.logOr();
	}

	variableExpression() {
		if (this.next?.type !== 'DEFINE') return this.logical();
		
		let kind = this.next.value;
		this.advance('DEFINE');
		let name = this.next;
		this.advance('IDENTIFIER');
		
		if (this.next?.type === 'ASSIGNMENT') {
			this.advance('ASSIGNMENT');
			let value = this.statement();

			return {
				type: 'DEFINE',
				name,
				value,
				kind,
				position: name?.position,
			}
		}
		return name;
	}

	exponentExpression() {
		return this.binaryExpression('variableExpression', 'isPower');
	}

	multiplicationExpression() {
		return this.binaryExpression('exponentExpression', 'isMultiplicative');
	}
	
	additionExpression() {
		return this.binaryExpression();
	}

	binaryExpression(par='multiplicationExpression', test='isAdditive') {
		let left = this[par]();

		while (this.next?.type === 'OPERATOR' && this.tokens[test](this.next.value)) {
			let op = this.next.value;
			this.advance('OPERATOR');
			let right = this[par]();

			left = {
				type: 'BINARY',
				operator: op,
				left,
				right,
				position: left?.position,
			}
		}

		return left;
	}

	blockStatement() {
		let body;
		if (this.next?.type === 'LBLOCK') {
			this.advance('LBLOCK', '{');
			body = this.statementList('RBLOCK');
			this.advance('RBLOCK', '}');
		} else {
			body = this.statement();
		}

		return {
			type: 'BLOCK',
			body,
			position: body?.position,
		}
	}

	parenthesizedExpression() {
		this.advance('LPAREN', '(');
		const body = this.statement();
		this.advance('RPAREN', ')');

		switch (this.next?.type) {
			case 'LPAREN':
				return this.functionCall(body);
			case 'OBJ_SEPERATOR':
				return this.linked(body);
			case 'LBRACK':
				return this.arraySelect(body);
		}

		return body;
	}

	argumentList(stopAt='RPAREN') {
		let args = [];
		if (this.next?.type !== stopAt) {
			do {
				if (this.next?.type === stopAt) break;
				args.push(this.statement());
			} while (this.next?.type === 'SEPERATOR' && this.advance('SEPERATOR'));
		}
		return args;
	}

	functionCall(name) {
		this.advance('LPAREN', '(');
		const args = this.argumentList('RPAREN');
		this.advance('RPAREN', ')');

		name = {
			type: 'FUNCTION_CALL',
			name,
			arguments: args,
			position: name?.position,
		};

		if (this.next?.type === 'LPAREN') {
			return this.functionCall(name);
		} else if (this.next?.type === 'OBJ_SEPERATOR') {
			return this.linked(name);
		}

		return name;
	}

	assignment(name) {
		let operator = this.next.value;
		this.advance('ASSIGNMENT');
		let value = this.statement();

		return {
			type: 'ASSIGN',
			operator,
			name,
			value,
			position: name?.position,
		};
	}

	linked(w) {
		this.advance('OBJ_SEPERATOR', '.');
		let other = this.identifier();
		
		return {
			type: 'LINKED',
			with: w,
			other,
			position: w?.position,
		}
	}

	assignmentSyntax(name) {
		let operator = this.next.value;
		this.advance('ASSIGNMENT_SS');

		return {
			type: 'SS_ASSIGN',
			operator,
			variable: name,
			position: name?.position,
		}
	}

	identifier(allowFunc=true) {
		let identifier = this.next;
		this.advance('IDENTIFIER');
		
		switch (this.next?.type) {
			case 'OBJ_SEPERATOR':
				return this.linked(identifier);
			case 'LBRACK':
				return this.arraySelect(identifier);
			case 'ASSIGNMENT_SS':
				return this.assignmentSyntax(identifier);
		}

		if (this.next?.type === 'LPAREN' && allowFunc) return this.functionCall(identifier);
		if (this.next?.type === 'ASSIGNMENT' && allowFunc) return this.assignment(identifier);

		return identifier;
	}

	classInstance() {
		const position = this.next?.position;
		this.advance('C_CREATE', 'new');

		const name = this.identifier(false);

		this.advance('LPAREN', '(');
		const args = this.argumentList('RPAREN');
		this.advance('RPAREN', ')');

		let rv = {
			type: 'CLASS_INSTANCE',
			name,
			arguments: args,
			position,
		};

		if (this.next?.type === 'OBJ_SEPERATOR') {
			return this.linked(rv);
		}

		return rv;
	}

	classDefinition() {
		// Get function name
		let pos = this.advance('C_DEFINE');
		let name = this.next;
		this.advance();

		// Get the arguments
		if (name?.type !== 'LPAREN') {
			this.advance('LPAREN');
		} else {
			name = null;
		}
		let argNames = this.argumentList('RPAREN');
		this.advance('RPAREN');

		// Get the function body
		const body = this.blockStatement();

		return {
			type: 'CLASS_DEFINITION',
			name,
			arguments: argNames,
			body,
			position: pos?.position,
		};
	}

	functionDefinition() {
		// Get function name
		let pos = this.advance('F_DEFINE');
		let name = this.next;
		this.advance();

		// Get the arguments
		if (name?.type !== 'LPAREN') {
			this.advance('LPAREN');
		} else {
			name = null;
		}
		let argNames = this.argumentList('RPAREN');
		this.advance('RPAREN');

		// Get the function body
		const body = this.blockStatement();

		return {
			type: 'FUNCTION_DEFINITION',
			name,
			arguments: argNames,
			body,
			position: pos?.position,
		};
	}

	objectStatement() {
		this.advance('LBLOCK');
		
		let obj = {};

		// hello: hey
		do {
			if (this.next?.type === 'RBLOCK') break;
			let name = this.next;
			
			if (this.next?.type !== 'IDENTIFIER' && this.next?.type !== 'STRING') throw new TypeError(`Value type is expected to be a string or identifier (${this.filename}:${this.next.position.line}:${this.next.position.cursor})`);
			if (this.next?.type === 'STRING') name.value = StringHandle(name.value.slice(1, -1));

			this.advance();
			this.advance('OBJ_SET');

			let value = this.statement();

			obj[name?.value] = value;
		} while (this.next?.type === 'SEPERATOR' && this.advance('SEPERATOR', ',')); // OBJ_SEPERATOR && OBJ_SET

		this.advance('RBLOCK');
		return {
			type: 'OBJECT',
			values: obj,
			position: obj?.position,
		}
	}
	
	arraySelect(a) {
		if (this.next?.type !== 'LBRACK') return a;
		this.advance('LBRACK');
		let select = this.statement();
		this.advance('RBRACK');

		let r = {
			type: 'ARRAY_SELECT',
			array: a,
			select,
			position: a?.position,
		};

		if (this.next?.type === 'LBRACK') {
			return this.arraySelect(r);
		}

		if (this.next?.type === 'ASSIGNMENT') {
			return this.assignment(r);
		}

		return r;
	}

	arrayStatement() {
		this.advance('LBRACK');
		let arr = this.argumentList('RBRACK');
		this.advance('RBRACK');

		return this.arraySelect({
			type: 'ARRAY',
			values: arr,
			position: arr?.position,
		});
	}

	logical() {
		return this.logicalExpression();
	}

	condition() {
		this.advance('LPAREN');
		let statement = this.logical();
		this.advance('RPAREN');

		let pass = this.blockStatement();
		let fail;

		if (this.next?.type === 'CONDITIONAL_ELSE') {
			this.advance('CONDITIONAL_ELSE');
			fail = this.blockStatement();
		}

		return {
			type: 'CONDITION',
			statement,
			pass,
			fail,
			position: statement?.position,
		};
	}

	conditionalStatement() {
		this.advance('CONDITIONAL');
		const condition = this.condition();
		return condition;
	}

	loopStatement() {
		let pos = this.advance('LOOP');
		this.advance('LPAREN');

		let definitions = [];
		let condition;
		let execute = [];

		while (this.next != null && this.next.type != 'RPAREN') {
			let stmt = this.statement();
			// res.push(stmt);
			switch (stmt?.type) {
				case 'DEFINE':
					definitions.push(stmt);
					break;
				case 'CONDITION':
					if (condition) {execute.push(stmt); break;}
					condition.push(stmt);
					break;
				default:
					execute.push(stmt);
			}
			if (this.next?.type === 'EXPR_END') this.advance('EXPR_END', ';');
		}

		this.advance('RPAREN');

		let pass = this.blockStatement();

		return {
			type: 'R_LOOP',
			definitions,
			condition,
			execute,
			pass,
			position: pos?.position,
		};
	}

	importStatement() {
		const pos = this.next.position;
		this.advance('IMPORT', 'import');
		const file = this.stringStatement();

		return {
			type: 'IMPORT',
			file,
			position: pos,
		}
	}

	exportStatement() {
		let pos = this.next.position;
		this.advance('EXPORT');
		let value = this.primaryStatement();

		return {
			type: 'EXPORT',
			value,
			position: pos,
		}
	}

	returnStatement() {
		let pos = this.next.position;
		this.advance('RETURN', 'return');
		let vtr = this.statement();

		return {
			type: 'RETURN',
			value: vtr,
			position: pos,
		};
	}

	primaryStatement() {
		switch (this.next?.type) {
			case 'EXPR_END':
				this.advance('EXPR_END');
				return { type: 'EMPTY' };
			case 'NUMBER':
				return this.numberStatement();
			case 'STRING':
				return this.stringStatement();
			case 'LBLOCK':
				return this.objectStatement();
			case 'LPAREN':
				return this.parenthesizedExpression();
			case 'OPERATOR':
				return this.unary();
			case 'IDENTIFIER':
				return this.identifier();
			case 'F_DEFINE':
				return this.functionDefinition();
			case 'C_DEFINE':
				return this.classDefinition();
			case 'C_CREATE':
				return this.classInstance();
			case 'LBRACK':
				return this.arrayStatement();
			case 'CONDITIONAL':
				return this.conditionalStatement();
			case 'LOOP':
				return this.loopStatement();
			case 'IMPORT':
				return this.importStatement();
			case 'EXPORT':
				return this.exportStatement();
			case 'RETURN':
				return this.returnStatement();
			default:
				const r = this.next;
				this.advance();
				return r;
		}
	}

	statement() {
		return this.additionExpression();
	}

	statementList(endOn) {
		let res = [];

		while (this.next != null && this.next.type != endOn) {
			res.push(this.statement());
			if (this.next?.type === 'EXPR_END') this.advance('EXPR_END', ';');
		}

		return res;
	}

	program() {
		return {
			type: 'PROGRAM',
			body: this.statementList()
		};
	}

	advance(type, lk) {
		lk = lk ?? type;
		if (type != null) {
			if (this.next == null) throw new SyntaxError(`Input abruptly ended while expecting '${lk}' (${this.filename}:EOF)`);
			if (this.next.type !== type) throw new SyntaxError(`Unexpected token '${this.next.value}': Expected '${lk}' (${this.filename}:${this.next.position.line}:${this.next.position.cursor})`);
		}

		this.next = this.tokens.nextToken();
		return this.next;
	}
}