const Environment = require('../environment');
const envfrom = (obj)=>new Environment(obj);

// probably gonna be moved to seperate files in the future
// ----------------------------------------------------------------
// math module
const math = envfrom({
	PI: Math.PI,
	sin: (n)=>Math.sin(n),
	cos: (n)=>Math.cos(n),
	pow: (n,e)=>Math.pow(n, e),
});
// process module
const proc = envfrom({
	exit: (code)=>process.exit(code),
});

const global = new Environment({
	VER: '1.0.0', // { constant: false, value: '1.0.0', },
	OS: process.platform, // { constant: true, value: process.platform, },

	true: true, // { constant: true, value: true, },
	false: false, // { constant: true, value: false, },

	Math: math,
	process: proc,

	// Native functions
	print(...args) { console.log(...args); return args.join(" "); },
	isNaN(arg) { return isNaN(arg); }
});

module.exports = global;