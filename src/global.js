const Environment = require('./environment');

const math = new Environment({
	PI: Math.PI,
	sin: (n)=>Math.sin(n),
	cos: (n)=>Math.cos(n),
	pow: (n,e)=>Math.pow(n, e),
});

const global = new Environment({
	VER: '1.0.0', // { constant: false, value: '1.0.0', },
	OS: process.platform, // { constant: true, value: process.platform, },

	true: true, // { constant: true, value: true, },
	false: false, // { constant: true, value: false, },

	Math: math,

	// Native functions
	print(...args) { console.log(...args); return args.join(" "); },
	isNaN(arg) { return isNaN(arg); }
});

module.exports = global;