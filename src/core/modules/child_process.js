/**
 * ---------------------------
 * CHILD PROCESS             |
 * ---------------------------
 * Read from terminal and execute arbitrary commands;
 * 
 * @description Read from terminal and execute arbitrary commands in Neon; (wrapper for node 'child_process' module)
 * @example child_process.execute('echo "HI"').stdout;
 */

const child_process = require('child_process');

module.exports = {
	parse(command) {
		// example command: echo hello      = {command: "echo", arguments: ["hello"]}
		let split = command.split(' ');
		const cmd = split.shift();
		
		let inString = false;
		let mode = '';
		let amo = 0;
		let contents = '';

		for (let i in split) {
			let cur = split[i];
			if ((cur.startsWith('"') && !cur.endsWith('"')) || (cur.startsWith("'") && !cur.endsWith("'"))) {
				contents = cur;
				mode = cur.slice(0, 1);
				inString = true;
				split.splice(i, 1);
			}
			if (inString) {
				amo++;
				contents += cur;
				if (cur.endsWith(mode)) {
					contents += cur;
					inString = false;
					amo--;
					split = split.slice(0, split.length-amo);
					split[split.length-amo] = contents;
				}
			}
		}

		return { command: cmd, arguments: split };	
	},
	execute(command, arguments, options) {
		const result = child_process.spawnSync(command, arguments, options);
		return {
			stdout: result.stdout,
			stderr: result.stderr,
			options: options,
		};
	}
};