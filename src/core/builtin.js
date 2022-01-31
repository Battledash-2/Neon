const exp = {};

// probably gonna be moved to seperate files in the future
// ----------------------------------------------------------------
// math module
exp.Math = {
	PI: Math.PI,
	sin: (n)=>Math.sin(n),
	cos: (n)=>Math.cos(n),
	pow: (n,e)=>Math.pow(n, e),
};
// process module
exp.process = {
	exit: (code)=>process.exit(code),
};

module.exports = exp;