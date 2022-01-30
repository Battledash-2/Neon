const Environment = require('./environment');

const Constructors = {
	String(THIS, env) {
		return new Environment({
			value: THIS,
			number: Number(THIS),
			length: Number(THIS.length),

			substring(from, to) {return THIS.slice(from, to);},
			split(txt) {return THIS.split(txt);},
			match(txt) {return THIS.match(new RegExp(txt, 'g'));}
		});
	},
	Number(THIS, env) {
		return new Environment({
			value: THIS,
			string: THIS.toString(),
		});
	},
	Array(THIS, env) {
		return new Environment({
			length: THIS.length,
			lastValue: THIS[THIS.length-1],

			push(v) {THIS.push(v); return THIS;},
			pop() {THIS.pop(); return THIS;},
			splice(pos, amo) {THIS.splice(pos, amo); return THIS;},
		});
	}
}

class Interpreter {
	constructor(filename='runtime') {
		this.filename = filename;
	}
	eval(exp, env=GlobalEnvironment) {
		const isTypeof = t => exp?.type?.toLowerCase() === t.toLowerCase();

		if (typeof exp === 'number') return exp;
		if (typeof exp === 'string') return exp;
		if (Array.isArray(exp)) return exp;

		this.pos = {
			...exp?.position ?? {line: 1, cursor: 1},
			filename: this.filename,
		};

		// Type related stuff:
		if (isTypeof('NUMBER')) {
			return exp?.value;
		}
		if (isTypeof('STRING')) {
			return exp?.value;
		}

		// Math related stuff:
		if (isTypeof('BINARY')) {
			return this.handleBinaryExpression(exp, env);
		}

		if (isTypeof('UNARY')) {
			return this.handleUnaryExpression(exp, env);
		}

		// --------------------------------
		// Variable related stuff:
		if (isTypeof('IDENTIFIER')) {
			return env.lookup(exp?.value, this.pos);
		}
		
		// Define
		if (isTypeof('DEFINE')) {
			return env.define(exp?.name?.value, this.eval(exp?.value, env), this.pos, exp?.kind === 'const' ? true : false);
		}
		// Assign
		if (isTypeof('ASSIGN')) {
			// Array
			if (exp?.name?.type !== 'IDENTIFIER') {
				let arr = this.eval(exp?.name?.array, env);
				arr[this.eval(exp?.name?.select)] = this.eval(exp?.value, env);
				
				return this.eval(exp?.value, env);
			}
			return this.generalAssign(exp, env);
		}
		// Assign Syntax Sugar
		if (isTypeof('SS_ASSIGN')) {
			switch (exp.operator) {
				case '++':
					return env.assign(exp?.variable?.value, env.lookup(exp?.variable?.value)+1, this.pos);
				case '--':
					return env.assign(exp?.variable?.value, env.lookup(exp?.variable?.value)-1, this.pos);
			}
		}

		// ------------------------
		// OOP

		// Arrays
		if (isTypeof('ARRAY')) {
			return exp.values.map(c=>this.eval(c, env));
		}

		// Array/Object Select
		if (isTypeof('ARRAY_SELECT')) {
			let arr = this.eval(exp.array, env);
			let to = this.eval(exp.select, env);
			return arr.record ? arr.record[to] : arr[to];
		}

		// Objects
		if (isTypeof('OBJECT')) {
			let objEnv = {};
		
			for (let name in exp.values) {
				objEnv[name] = this.eval(exp.values[name], env);
			}

			return new Environment(objEnv, env);
		}

		// Linked
		if (isTypeof('LINKED')) {
			let to = this.eval(exp.with, env);

			if (exp.with?.type === 'STRING' || typeof to === 'string') to = Constructors.String(to, env);
			if (exp.with?.type === 'NUMBER' || typeof to === 'number') to = Constructors.Number(to, env);
			if (exp.with?.type === 'ARRAY' || (typeof to === 'object' && Array.isArray(to))) to = Constructors.Array(to, env);
			
			if (exp.other?.type === 'FUNCTION_CALL') {
				let fenv = new Environment(to.record, env);
				return this.callFunc(exp.other, fenv);
			}

			let lookup = exp.other?.type === 'IDENTIFIER' ? to.lookup(exp.other?.value) : this.eval(exp.other, to);
			
			return lookup;
		}

		// ------------------------
		// Functions

		// Function call
		if (isTypeof('FUNCTION_CALL')) {
			return this.callFunc(exp, env);
		}

		// Function definition
		if (isTypeof('FUNCTION_DEFINITION')) {
			const fname = exp?.name?.value;
			const args = exp?.arguments;
			const body = exp?.body;

			let func = {
				arguments: args,
				body,
				env,
			}

			if (fname != null) env.define(fname, func, this.pos);
			return func;
		}

		// ----------------------
		// Conditional

		// Handle
		if (isTypeof('LOGICAL')) {
			return this.handleLogicalExpression(exp, env);
		}
		// IF-Statements
		if (isTypeof('CONDITION')) {
			if (this.eval(exp.statement, env)) {
				return this.evalBlock(exp.pass, env);
			} else if(typeof exp.fail !== 'undefined') {
				return this.evalBlock(exp.fail, env);
			} else {
				return false;
			}
		}
		// Loops
		if (isTypeof('R_LOOP')) {
			let loopEnv = new Environment({}, env);
			this.evalLoopNB(exp.definitions, loopEnv);
			
			let res;

			while (this.eval(exp.execute[0], loopEnv)) {
				res = this.evalBlock(exp.pass, loopEnv);
				this.evalLoopNB(exp.execute.slice(1), loopEnv);
			}

			return res;
		}

		// Block
		if (isTypeof('BLOCK')) {
			return this.evalBlock(exp?.body, env);
		}
		if (isTypeof('PROGRAM')) {
			let res;
			exp.body.forEach(item=>{
				res = this.eval(item, env);
			});
			return res;
		}

		// Unknown
		throw new Error(`Unexpected AST '${exp.type}' (${this.filename}:${this.pos.line}:${this.pos.cursor})`);
	}

	evalLoopNB(block, env) {
		let res;
		if (Array.isArray(block)) {
			block.forEach(item=>{
				res = this.eval(item, env);
			});
		} else {
			res = this.eval(block, env);
		}
		return res;
	}

	evalLoop(block, env) {
		return this.evalLoopNB(block.body, env);
	}

	evalBlock(blk, env) {
		const blockEnv = new Environment({}, env);
		return this.evalLoop(blk, blockEnv);
	}

	callFunc(exp, env) {
		let func = this.eval(exp?.name, env); // env.lookup(exp?.name?.value);
		
		// Native functions
		if (typeof func === 'function') {
			return func(...exp?.arguments.map(val=>this.eval(val, env)));
		}

		// User functions
		let args = {};
		for (let pos in func.arguments) {
			if (func.arguments[pos].type !== 'IDENTIFIER') throw new TypeError(`Expected all arguments to be identifiers in function call to '${exp?.name?.value}'`);
			args[func.arguments[pos].value] = this.eval(exp?.arguments[pos], env);
		}

		// let funcEnv = new Environment(args, env);
		let funcEnv = new Environment(args, func.env);
		return this.evalLoop(func.body, funcEnv);
	}

	generalAssign(exp, env) { // env.assign(exp?.name?.value, this.eval(exp?.value, env))
		switch (exp.operator) {
			case '=':
				return env.assign(exp?.name?.value, this.eval(exp?.value, env), this.pos);
			case '+=':
				return env.assign(exp?.name?.value, env.lookup(exp.name.value) + this.eval(exp?.value, env), this.pos);
			case '-=':
				return env.assign(exp?.name?.value, env.lookup(exp.name.value) - this.eval(exp?.value, env), this.pos);
			case '*=':
				return env.assign(exp?.name?.value, env.lookup(exp.name.value) * this.eval(exp?.value, env), this.pos);
		}
	}

	handleBinaryExpression(exp, env) {
		let left = this.eval(exp?.left, env);
		let right = this.eval(exp?.right, env);

		switch (exp?.operator) {
			case '+':
				return left + right;
			case '*':
				return left * right;
			case '-':
				return left - right;
			case '/':
				return left / right;
			case '^':
				return left ** right;
		}
	}

	handleLogicalExpression(exp, env) {
		let left = this.eval(exp?.left, env);
		let right = this.eval(exp?.right, env);

		switch (exp?.operator) {
			case '==':
				return left === right;
			case '!=':
				return left !== right;
			case '&&':
				return left && right;
			case '||':
				return left || right;
			case '<':
				return left < right;
			case '>':
				return left > right;
			case '<=':
				return left <= right;
			case '>=':
				return left >= right;
		}
	}

	handleUnaryExpression(exp, env) {
		// return Number(exp?.operator + this.eval(exp?.value, env));
		switch (exp?.operator) {
			case '-':
				return -(this.eval(exp?.value, env));
			case '+':
				return +(this.eval(exp?.value, env));
			case '!':
				return !(this.eval(exp?.value, env));
		}
	}

	_isNumber(exp) {
		return typeof exp === 'number';
	}
}

const GlobalEnvironment = new Environment({
	VER: '1.0.0', // { constant: false, value: '1.0.0', },
	OS: process.platform, // { constant: true, value: process.platform, },

	true: true, // { constant: true, value: true, },
	false: false, // { constant: true, value: false, },
	
	// Native functions
	print(...args) { console.log(...args); return args.join(" "); },
	isNaN(arg) { return isNaN(arg); }
});

module.exports = Interpreter;