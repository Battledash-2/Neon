const consreturn = (value)=>({value});
const exp = {};

exp.String = class {
	constructor(s) {
		return consreturn(s?.toString?.());
	}
}
exp.Number = class {
	constructor(n) {
		return consreturn(Number(n));
	}
}

module.exports = exp;