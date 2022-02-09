module.exports = {
	String(THIS, env) {
		return {
			value: THIS,
			number: Number(THIS),
			length: Number(THIS.length),

			substring(_e, from, to) { return THIS.slice(from, to); },
			split(_e,txt) { return THIS.split(txt); },

			match(_e,txt) { return THIS.match(new RegExp(txt, 'g')); },
			repeat(_e,amt) { return THIS.repeat(amt); },

			charAt(at) { return THIS.charAt(at); },
			charCodeAt(at) { return THIS.charCodeAt(at); }
		};
	},
	Number(THIS, env) {
		return {
			value: THIS,
			string: THIS.toString(),
		};
	},
	Array(THIS, env) {
		return {
			length: THIS.length,
			lastValue: THIS[THIS.length-1],

			push(_e,v) {THIS.push(v); return THIS;},
			pop() {THIS.pop(); return THIS;},
			splice(_e,pos, amo) {THIS.splice(pos, amo); return THIS;},
			join(_e,wt=" ") {return THIS.join(wt);},

			map(cb) {
				let res = [...THIS];
				for (let i in res) {
					res[i] = cb(res[i]);
				}
				return res;
			},
		};
	},
	Function(THIS, env) {
		return {
			name: THIS?.value?.name ?? THIS.name,
			isNative: typeof THIS === 'function',
		};
	}
};