const Environment = require('./environment');

const Constructors = {
	String(THIS) {
		return new Environment({
			value: THIS,
			number: Number(THIS),
		});
	},
	Number(THIS) {
		return new Environment({
			value: THIS,
			string: THIS.toString(),
		});
	}
}

class Interpreter {
	eval(exp, env=GlobalEnvironment) {
		const isTypeof = t => exp?.type?.toLowerCase() === t.toLowerCase();

		if (this._isNumber(exp)) return exp;
		if (Array.isArray(exp)) return exp;

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
			return Number(exp?.operator + this.eval(exp?.value, env));
		}

		// --------------------------------
		// Variable related stuff:
		if (isTypeof('IDENTIFIER')) {
			return env.lookup(exp?.value);
		}
		
		// Define
		if (isTypeof('DEFINE')) {
			return env.define(exp?.name?.value, this.eval(exp?.value, env));
		}
		// Assign
		if (isTypeof('ASSIGN')) {
			// Array
			if (exp?.name?.type !== 'IDENTIFIER') {
				let arr = this.eval(exp?.name?.array, env);
				arr[this.eval(exp?.name?.select)] = this.eval(exp?.value, env);
				
				return this.eval(exp?.value, env);
			}
			return env.assign(exp?.name?.value, this.eval(exp?.value, env));
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

			return arr[to];
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

			if (exp.with?.type === 'STRING' || typeof to === 'string') to = Constructors.String(to);
			if (exp.with?.type === 'NUMBER' || typeof to === 'number') to = Constructors.Number(to);
			
			if (exp.other?.type === 'FUNCTION_CALL') {
				return this.callFunc(exp.other, to);
			}

			// console.log(this.eval(exp.other, to), exp.other)
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
			
			if (fname != null) env.define(fname, func);
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
			if (this.eval(exp.statement)) {
				return this.evalBlock(exp.pass, env);
			} else {
				return this.evalBlock(exp.fail, env);
			}
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
		throw new Error(`Unknown execution: ${JSON.stringify(exp)}`);
	}

	evalLoop(block, env) {
		let res;
		block.body.forEach(item=>{
			res = this.eval(item, env);
		});
		return res;
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

	_isNumber(exp) {
		return typeof exp === 'number';
	}
}

const GlobalEnvironment = new Environment({
	VER: '1.0.0',
	OS: process.platform,

	true: true,
	false: false,
	
	// Native functions
	print(...args) { console.log(...args); return args.join(" "); },
});

module.exports = Interpreter;