const Environment = require('../environment');
const LiteralConstructors = require('./literal_constructors');
const Builtin = require('./builtin');

const global = new Environment({
	VER: '1.0.0', // { constant: false, value: '1.0.0', },
	OS: process.platform, // { constant: true, value: process.platform, },

	true: true, // { constant: true, value: true, },
	false: false, // { constant: true, value: false, },

	...Builtin,
	...LiteralConstructors,

	// Native functions
	print(...args) { console.log(...args); return args.join(" "); },
	isNaN(arg) { return isNaN(arg); }
});

module.exports = global;