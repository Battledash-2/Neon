const exp = {};

// probably gonna be moved to seperate files in the future
// ----------------------------------------------------------------

exp.Math = Math;
exp.process = process;

exp.Object = {
	freeze(obj) {
		if (typeof obj === 'object' && Array.isArray(obj)) { Object.freeze(obj); return true; }
		if (typeof obj?.locked === 'undefined' || obj?.locked !== false) throw new ReferenceError(`Attempt to freeze a non-object`);
		obj.locked = true;
		return true;
	},
	isArray(obj) {
		return typeof obj === 'object' && Array.isArray(obj);
	},
	isObject(obj) {
		return typeof obj === 'object';
	},
};

module.exports = exp;