const Environment = require('../environment');
const LiteralConstructors = require('./literal_constructors');
const Builtin = require('./builtin');

const glbl = {
	VER: '1.0.0', // { constant: false, value: '1.0.0', },
	OS: process.platform, // { constant: true, value: process.platform, },

	...Builtin,
	...LiteralConstructors,

	// Native functions
	print(...args) { console.log(...args); return args.join(" "); },
	isNaN(arg) { return isNaN(arg); }
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
