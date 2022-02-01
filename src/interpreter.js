// const fs = require('fs');
// const path = require('path');
// const Lexer = require('./lexer');
// const Parser = require('./parser');
const Environment = require('./environment');
const Constructors = require('./core/constructors');

class Internal {
	constructor(type, value) {
		this.type = type;
		this.value = value;
	}
}

class Interpreter {
	constructor(filename='runtime') {
		this.filename = filename;
		this.exports = {};
	}
	eval(exp, env=GlobalEnvironment, exportMode=false, preventInherit=false, stopOn) {
		const isTypeof = t => exp?.type?.toLowerCase() === t.toLowerCase();
		if (exp == null
			|| typeof exp === 'number'
			|| typeof exp === 'string'
			|| typeof exp === 'boolean') return exp;
		if (Array.isArray(exp)) return exp;

		this.pos = {
			...(exp?.position ?? {line: 1, cursor: 1}),
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
			if (!preventInherit) return (env instanceof Environment) ? env.lookup(exp?.value, this.pos) : env[exp?.value];
			return (env instanceof Environment) ? env.nonInheritedlookup(exp?.value, this.pos) : env[exp?.value];
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
				if (!(arr instanceof Environment)) {
					arr[this.eval(exp?.name?.select, env)] = this.eval(exp?.value, env);
				} else {
					arr.assign(this.eval(exp?.name?.select, env), this.eval(exp?.value, env), this.pos);
				}
				
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

			return new Environment(objEnv);
		}

		// Linked
		if (isTypeof('LINKED')) {
			let to = this.eval(exp?.with, env, false, preventInherit);

			if (exp.with?.type === 'STRING' || typeof to === 'string') to = Constructors.String(to, env);
			if (exp.with?.type === 'NUMBER' || typeof to === 'number') to = Constructors.Number(to, env);
			if (exp.with?.type === 'ARRAY' || (typeof to === 'object' && Array.isArray(to))) to = Constructors.Array(to, env);

			if (exp?.other?.type === 'FUNCTION_CALL') {
				let fenv = new Environment((to instanceof Environment) ? to.record : to, env);
				return this.callFunc(exp?.other, fenv);
			}
			let pos = exp?.other?.type === 'IDENTIFIER' ? ((to instanceof Environment) ? to.lookup(exp?.other?.value, this.pos) : to?.[exp?.other?.value]) : this.eval(exp?.other, ((to instanceof Environment) ? to : new Environment(to, env)), false, true);
			return pos;
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

		// ------------------------------------
		// Classes (OOP)
		// Class instance
		if (isTypeof('CLASS_INSTANCE')) {
			const cls = this.eval(exp?.name, env);

			if (cls?.constructor?.name?.toLowerCase?.() === 'function') {
				return new cls(...(exp?.arguments?.map(c=>this.eval(c, env))))?.value;
			}

			let args = {};
			for (let pos in cls.arguments) {
				if (cls.arguments[pos].type !== 'IDENTIFIER') throw new TypeError(`Expected all arguments to be identifiers in function call to '${exp?.name?.value}'`);
				args[cls.arguments[pos].value] = this.eval(exp?.arguments[pos], env);
			}

			let classEnv = new Environment(args, cls.env);
			this.evalLoop(cls.body, classEnv);
			return classEnv;
		}

		// Class definition
		if (isTypeof('CLASS_DEFINITION')) {
			const fname = exp?.name?.value;
			const args = exp?.arguments;
			const body = exp?.body;

			let cls = {
				arguments: args,
				body,
				env: new Environment(env.record, env.parent),
			}

			if (fname != null) env.define(fname, cls, this.pos);
			return cls;
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
				let tres = this.evalBlock(exp.pass, loopEnv);
				if (tres instanceof Internal && (tres.type === 'break' || tres.type === 'return')) {
					if (tres.type === 'break') { res = tres.value; break };
					if (tres.type === 'return') return tres;
				}
				res = tres;
				this.evalLoopNB(exp.execute.slice(1), loopEnv);
			}

			return res;
		}

		// Imports
		if (isTypeof('IMPORT')) {
			throw 'unimplemented';
		}

		// Export
		if (isTypeof('EXPORT')) {
			throw 'unimplemented';
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
			if (exportMode) return this.exports;
			return res;
		}

		// // Break / Return
		if (isTypeof('BREAK')) {
			return new Internal('break', null);
		}
		if (isTypeof('RETURN')) {
			return new Internal('return', this.eval(exp.value, env));
		}

		// Objects / Classes
		if (exp instanceof Environment) {
			return exp;
		}

		// Unknown
		throw new Error(`Unexpected AST '${exp?.type}' (${this.filename}:${this.pos.line}:${this.pos.cursor})`);
	}

	evalLoopNB(block, env) {
		let res;
		if (Array.isArray(block)) {
			for (let item of block) {
				let tres = this.eval(item, env);
				if (tres instanceof Internal && (tres.type === 'break' || tres.type === 'return')) {
					if (tres.type === 'break') return new Internal('break', (typeof res !== 'undefined') ? res : null);
					if (tres.type === 'return') return tres;
				}
				res = tres;
			}
		} else {
			let tres = this.eval(block, env);
			if (tres instanceof Internal && (tres.type === 'break' || tres.type === 'return')) {
				if (tres.type === 'break') return new Internal('break', (typeof res !== 'undefined') ? res : null);
				if (tres.type === 'return') return tres;
			}
			res = tres;
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
		// console.log('f', funcEnv.parent.record.myObj)
		let res = this.evalLoop(func.body, funcEnv);
		if (res instanceof Internal && res.type === 'return') {
			return this.eval(res.value, funcEnv);
		}
		return res;
		// return this.evalLoop(func.body, funcEnv, );
	}

	generalAssign(exp, env) { // env.assign(exp?.name?.value, this.eval(exp?.value, env))
		switch (exp.operator) {
			case '=':
				if (env instanceof Environment) {
					return env.assign(exp?.name?.value, this.eval(exp?.value, env), this.pos);
				} else {
					return env[exp?.name?.value] = this.eval(exp?.value, env);
				}
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

const GlobalEnvironment = require('./core/global');

module.exports = Interpreter;