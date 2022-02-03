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
	print(...args) { console.log(...args); return args.join(" "); },
	isNaN(arg) { return isNaN(arg); },

	console: {
		clear: ()=>console.clear(),
		log (...args){ console.log(...args); return args.join(" "); }
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
