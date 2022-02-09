const fs = require('fs');
const path = require('path');

const Lexer = require('./lexer');
const Parser = require('./parser');

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
		this.ids = {};
	}
	eval(exp, env=GlobalEnvironment, exportMode=false, preventInherit=false, stopOn) {
		const isTypeof = t => exp?.type?.toLowerCase() === t.toLowerCase();
		if (exp == null
			|| typeof exp === 'number'
			|| typeof exp === 'string'
			|| typeof exp === 'boolean'
			|| Array.isArray(exp)) return exp;

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

			// Instanceof internal ...
			if ((to instanceof Internal && to.type === 'function' && to?.value?.isFunction) || typeof to === 'function') to = Constructors.Function(to, env);

			if (to instanceof Internal) throw new ReferenceError(`Cannot read properties from internal objects (${this.filename}:${this.pos.line}:${this.pos.cursor})`);

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

			let func = new Internal('function', {
				isClass: false,
				isFunction: true,
				name: fname,
				cid: 0, // this is a function, not a class
				arguments: args,
				body,
				env,
			});

			if (fname != null) env.define(fname, func, this.pos);
			return func;
		}

		// ------------------------------------
		// Classes (OOP)
		// Class instance
		if (isTypeof('CLASS_INSTANCE')) {
			let cls = this.eval(exp?.name, env);

			if (typeof cls === 'function') {
				let c = new cls(...(exp?.arguments?.map(c=>this.eval(c, env))));
				return c?.value ?? new Environment(c, env);
			}

			if (!(cls instanceof Internal) || (cls?.type !== 'class' && cls?.type !== 'function')) throw new Error(`Reference item is not a class`);
			cls = cls.value;

			let args = {};
			for (let pos in cls.arguments) {
				if (cls.arguments[pos].type !== 'IDENTIFIER') throw new TypeError(`Expected all arguments to be identifiers in function call to '${exp?.name?.value}'`);
				args[cls.arguments[pos].value] = this.eval(exp?.arguments[pos], env);
			}

			let classEnv = new Environment(args, cls.env);
			this.evalLoop(cls.body, classEnv);
			classEnv.name = cls.name;
			classEnv.classID = cls.cid;
			return classEnv;
		}

		// Class definition
		if (isTypeof('CLASS_DEFINITION')) {
			const fname = exp?.name?.value;
			const args = exp?.arguments;
			const body = exp?.body;

			let cls = new Internal('class', {
				isClass: true,
				isFunction: false,
				name: fname,
				cid: this.pidSys('cid'),
				arguments: args,
				body,
				env: new Environment(env.record, env.parent),
			});

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
			// throw 'unimplemented';
			let file  = exp.file.value;
			let jsf = file.replace(/\\/g, '/').split('/');
			jsf[jsf.length-1] = jsf[jsf.length-1]+'.js';

			let fcontent;

			if (file.endsWith('.js') && fs.existsSync(path.join(process.cwd(), file))) {
				const renv = require(path.join(process.cwd(), file));
				return renv;
			} else if (fs.existsSync(path.join(process.cwd(), file))) {
				fcontent = fs.readFileSync(path.join(process.cwd(), file));
			} else if (fs.existsSync(path.join(__dirname, 'core', 'modules', ...jsf))) {
				const renv = require(path.join(__dirname, 'core', 'modules', ...jsf));
				return renv;
			} else if (fs.existsSync(path.join(process.cwd(), '.modules', file))) {
				fcontent = fs.readFileSync(path.join(process.cwd(), '.modules', file));
			} else {
				throw new ReferenceError(`Attempt to import file '${file}' which does not exist`);
			}

			let lexed  = new Lexer(fcontent, file);
			let parsed = new Parser(lexed, file);
			let runner = new Interpreter(file);

			let fileEnv = ENVConstruct.create();
			let resultEnv = runner.eval(parsed, fileEnv, true);

			//env.define(fname, new Environment(resultEnv));
			return resultEnv;
		}

		// Export
		if (isTypeof('EXPORT')) {
			this.exports[exp.value.value] = this.eval(exp.value, env);
			return true;
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

		// Ternary
		if (isTypeof('TERNARY')) {
			if (this.eval(exp.condition, env)) {
				return this.eval(exp.success, env);
			}
			return this.eval(exp.fail, env);
		}

		// Switch ... Case ...
		if (isTypeof('SWITCH_STATEMENT')) {
			const executeOn = this.eval(exp.handler, env);
			let res;
			let switchEnvironment = new Environment({}, env);
			let anyPassed = false;
			for (let condition of exp.statements) {
				if (this.eval(condition.condition, env) === executeOn) {
					anyPassed = true;
					let tres = this.evalLoop(condition.body, switchEnvironment);
					if (tres instanceof Internal && tres.type === 'break') {
						res = tres?.value;
						break;
					};
					res = tres?.value;
				}
			}
			if (!anyPassed && exp.default != null) {
				return this.evalLoop(exp.default, switchEnvironment);
			}
			return res;
		}

		// Try ... Catch
		if (isTypeof('TRY_CATCH')) {
			try {
				return this.evalBlock(exp.block, env);
			} catch(e) {
				let nenv = new Environment({ [exp.onerror.id.value]: e.message }, env);
				return this.evalLoop(exp.onerror.body, nenv);
			}
		}
		
		// With ... ...
		if (isTypeof('WITH_STATEMENT')) {
			const urenv = this.eval(exp.env, env);
			const renv  = new Environment({...(urenv instanceof Environment ? urenv.record : urenv)}, env);
			return this.evalLoop(exp.block, renv);
		}

		// ... <obj>
		if (isTypeof('THROW_ERROR')) {
			throw new Error('[Error]: ' + this.eval(exp.message) + ` (${this.filename}:${this.pos.line}:${this.pos.cursor})`);
		}
		if (isTypeof('TYPEOF_OBJ')) {
			let object = this.eval(exp.object);
			
			if (object instanceof Internal) return object.type.toLowerCase();
			if (object instanceof Environment) return 'object';

			if (typeof object === 'undefined' || object == null) return 'undefined';

			let type = typeof object;

			
			if (type === 'object' && Array.isArray(object)) return 'array';
			if (type === 'object') return 'object';

			if (type === 'function') return 'internal_function';


			if (type === 'undefined'
				|| type === 'number'
				|| type === 'string'
				|| type === 'boolean') return type;

			return false;
		}

		// Break / Return
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
			if ((/\s*(function)?\s*[a-zA-Z0-9_$]+\(_e.*?\)/.exec(func.toString()))?.length == null) return this.handleBuiltinFunc(func, exp, env, false);
			return this.handleBuiltinFunc(func, exp, env);
		}

		// User functions
		if (!(func instanceof Internal) || (func?.type !== 'class' && func?.type !== 'function')) throw new Error(`Reference item is not a function (${func instanceof Internal}, ${func.type})`);
		func = func.value;

		let args = {};
		for (let pos in func.arguments) {
			if (func.arguments[pos].type !== 'IDENTIFIER') throw new TypeError(`Expected all arguments to be identifiers in function call to '${exp?.name?.value}'`);
			args[func.arguments[pos].value] = this.eval(exp?.arguments[pos], env);
		}
		args.arguments = exp?.arguments.map(i=>this.eval(i, env));

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

	handleBuiltinFunc(func, exp, env, mode=true) {
		let res;
		try {
			let args = exp?.arguments.map(val=>{
				let r = this.eval(val, env);

				if (r?.value?.isFunction == true) {
					let raw = r;
					let fargs = r.value.arguments;
					let fenv = r.value.env;
					let body = r.value.body;
					let l = (...arg)=>{
						let args = {};
						for (let pos in fargs) {
							if (fargs[pos].type !== 'IDENTIFIER') throw new TypeError(`Expected all arguments to be identifiers in function call to '${exp?.name?.value}'`);
							args[fargs[pos].value] = arg[pos];
						}
						let funcEnv = new Environment(args, fenv);
						let res = this.evalLoop(body, funcEnv);
						if (res instanceof Internal && res.type === 'return') {
							return this.eval(res.value, funcEnv);
						}
						return res;
					};
					if (mode) {
						r = {
							exec: l,
							raw,
						}
					} else {
						r = l;
					}
				}
				if (r?.value?.isClass) {
					let raw = r;
					let cargs = r.value.arguments;
					let cenv = r.value.env;
					let cbody = r.value.body;
					let l = class {
						constructor(...arg) {
							let args = {};
							for (let pos in cargs) {
								if (cargs[pos].type !== 'IDENTIFIER') throw new TypeError(`Expected all arguments to be identifiers in function call to '${exp?.name?.value}'`);
								args[cargs[pos].value] = arg[pos];
							}

							let classEnv = new Environment(args, cenv);
							this.evalLoop(cbody, classEnv);
							return classEnv;
						}
					};
					if (mode) {
						r = {
							exec: l,
							raw,
						}
					} else {
						r = l;
					}
				}

				return r;
			});
			if (mode) {
				res = func(env, ...args);
			} else {
				res = func(...args);
			}
		} catch(e) {
			throw new e.constructor(e.message + ` (${this.filename}:${this.pos.line}:${this.pos.cursor})`);
		}
		return res;
	}

	generalAssign(exp, env) { // env.assign(exp?.name?.value, this.eval(exp?.value, env))
		switch (exp.operator) {
			case '=':
				if (env instanceof Environment) return env.assign(exp?.name?.value, this.eval(exp?.value, env), this.pos);
				return env[exp?.name?.value] = this.eval(exp?.value, env);
			case '+=':
				if (env instanceof Environment) return env.assign(exp?.name?.value, env.lookup(exp.name.value) + this.eval(exp?.value, env), this.pos);
				env[exp?.name?.value] += this.eval(exp?.value, env);
			case '-=':
				if (env instanceof Environment) return env.assign(exp?.name?.value, env.lookup(exp.name.value) - this.eval(exp?.value, env), this.pos);			
				env[exp?.name?.value] -= this.eval(exp?.value, env);
			case '*=':
				if (env instanceof Environment) return env.assign(exp?.name?.value, env.lookup(exp.name.value) * this.eval(exp?.value, env), this.pos);
				env[exp?.name?.value] *= this.eval(exp?.value, env);
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

	pidSys(name) {
		if (!this.ids.hasOwnProperty(name)) this.ids[name] = 0;
		return ++this.ids[name];
	}

	_isNumber(exp) {
		return typeof exp === 'number';
	}
}

const ENVConstruct = require('./core/global')(Interpreter);
const GlobalEnvironment = ENVConstruct.default;

module.exports = Interpreter;