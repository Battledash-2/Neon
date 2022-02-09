/**
 * ---------------------------
 * BUFFER MODULE             |
 * ---------------------------
 * Buffers;
 * 
 * @description Buffers in Neon; (custom)
 * @example Buffer.allocate([Int amount], [Any content]);
 */

const bindAlloc = (amount=0, content) => {
	amount = parseInt(amount);
	if (isNaN(amount)) throw new Error(`Attempt to allocate a non-integer amount`);
	if (content != null && content !== '' && amount < content.length) throw new Error(`Attempt to allocate more content to a buffer than possible`);
	
	let realBuffer;

	if (content != null && content !== '') { realBuffer = Buffer.from(content); }  
	else { realBuffer = Buffer.alloc(amount); }
	return {
		read() { return String(realBuffer); },
		write(content='') {
			if (content.length > amount) throw new Error(`Attempt to change buffer value to illegal amount`);
			realBuffer = Buffer.from(content);
			return realBuffer;
		},
		amount(amount=0) {
			if (amount < content.length && content != null && content !== '') throw new Error(`Attempt to change buffer amount to illegal size`);
			realBuffer = Buffer.alloc(amount);
			return realBuffer;
		},
		deallocate() {
			realBuffer = null;
			return realBuffer;
		},
	};
};

module.exports = {
	allocate: bindAlloc,
	allocateFrom(content) { return bindAlloc(content.length, content); }
};