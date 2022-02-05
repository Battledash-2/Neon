/**
 * JSIntegration Plugin
 * 
 * @description Import Javascript modules within Neon
 * @example jsinteg.require('http');
 */

module.exports = {
	require(_e, mod) {
		if (mod == null) throw new Error(`Attempt to import 'null'`);
		return require(mod);
	},
	call(_e, func, ...arg) {
		return func(...arg);
	},
};