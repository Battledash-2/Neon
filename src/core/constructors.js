module.exports = {
	String(THIS, env) {
		return {
			value: THIS,
			number: Number(THIS),
			length: Number(THIS.length),

			substring(from, to) {return THIS.slice(from, to);},
			split(txt) {return THIS.split(txt);},

			match(txt) {return THIS.match(new RegExp(txt, 'g'));},
			repeat(amt) {return THIS.repeat(amt);}
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

			push(v) {THIS.push(v); return THIS;},
			pop() {THIS.pop(); return THIS;},
			splice(pos, amo) {THIS.splice(pos, amo); return THIS;},
			join(wt=" ") {return THIS.join(wt);},
		};
	}
};