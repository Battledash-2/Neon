const exp = {};

// probably gonna be moved to seperate files in the future
// ----------------------------------------------------------------
// math module
exp.Math = {
	PI: Math.PI,
	sin: (_e,n)=>Math.sin(n),
	cos: (_e,n)=>Math.cos(n),
	pow: (_e,n,e)=>Math.pow(n, e),
};
// process module
exp.process = {
	exit: (_e,code)=>process.exit(code),
};

module.exports = exp;