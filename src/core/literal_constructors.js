const consreturn = (value)=>({value});
const exp = {};

// new String(32);
exp.String = class {
	constructor(s) {
		return consreturn(s?.toString?.());
	}
}
// new Number('32');
exp.Number = class {
	constructor(n) {
		return consreturn(Number(n));
	}
}
// new Array('hello', 32, 'hey');
exp.Array = class {
	constructor(...args) {
		return consreturn([...args]);
	}
}

module.exports = exp;