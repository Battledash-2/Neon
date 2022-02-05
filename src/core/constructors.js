module.exports = {
	String(THIS, env) {
		return {
			value: THIS,
			number: Number(THIS),
			length: Number(THIS.length),

			substring(_e, from, to) {return THIS.slice(from, to);},
			split(_e,txt) {return THIS.split(txt);},

			match(_e,txt) {return THIS.match(new RegExp(txt, 'g'));},
			repeat(_e,amt) {return THIS.repeat(amt);}
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
		};
	},
	Function(THIS, env) {
		return {
			name: THIS?.value?.name ?? THIS.name,
			isNative: typeof THIS === 'function',
		};
	}
};