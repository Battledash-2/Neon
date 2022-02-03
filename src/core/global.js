const Environment = require('../environment');
const LiteralConstructors = require('./literal_constructors');
const Builtin = require('./builtin');

const glbl = {
	VER: '2.1.1', // { constant: false, value: '1.0.0', },
	OS: process.platform, // { constant: true, value: process.platform, },

	...Builtin,
	...LiteralConstructors,

	// ---------------------------
	// Native
	// -- Console
	print(_env, ...args) { console.log(...args); return args.join(" "); },
	clear: (_env)=>console.clear(),

	// -- Types
	isNaN(_env, arg) { return isNaN(arg); },

	// -------------
	// -- Functional
	// - TIMEOUTS
	timeout(_env, arg, time) { return setTimeout(arg.exec, time); },
	interval(_env, arg, time) { return setInterval(arg.exec, time); },

	deleteInterval(_env, arg) { return clearInterval(arg); },

	// -------------
	// - ENVIRONMENTS
	getfenv(_e, f) { 
		if (typeof f === 'undefined') return _e;
		return f?.raw?.value?.env;
	},
	setfenv(_e, f, o) {
		if (typeof o === 'undefined') return _e = f;
		if (typeof f?.raw === 'undefined') return f = o;
		return f.raw.value.env = o;
	}
};

const global = new Environment({...glbl});

global.define('true', true, {}, true);
global.define('false', false, {}, true);
global.define('null', null, {}, true);

module.exports['default'] = global;
module.exports['create'] = ()=>{
	let nv = new Environment({...glbl}); // dup for an actual 'new' env
	nv.define('true', true, {}, true);
	nv.define('false', false, {}, true);
	nv.define('null', null, {}, true);

	return nv;
};
