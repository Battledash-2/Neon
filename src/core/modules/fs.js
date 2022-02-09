/**
 * ---------------------------
 * FS MODULE                 |
 * ---------------------------
 * Read and modify files;
 * 
 * @description Read and write to files in Neon; (wrapper for node 'fs' module)
 * @example fs.open('file', 'w+').read();
 */

const fs = require('fs');

module.exports = {
	open(fileName, tags="w+") {
		let file = fs.openSync(fileName, tags);
		let closed = false;
		return {
			readBuf(amount=0) {
				if (closed) throw new ReferenceError(`Cannot read closed file`);
				let buffer = Buffer.alloc(amount);
				fs.readSync(file, buffer, 0, amount, 0);
				return String(buffer);
			},

			read() { if (closed) throw new ReferenceError(`Cannot read closed file`); return String(fs.readFileSync(fileName)); },
			write(contents) { if (closed) throw new ReferenceError(`Cannot write closed file`); return fs.writeSync(file, contents); },

			close() { if (closed) throw new ReferenceError(`File already closed`); closed = true; return fs.closeSync(file); },
		};
	},
	
	makeDirectory(path) { return fs.mkdirSync(path); },
	createFile(path) { return fs.writeFileSync(path, ''); },

	readDirectory(path) { return fs.readdirSync(path); },
};