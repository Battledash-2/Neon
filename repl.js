const global = require('./src/core/global');

const lexer = require('./src/lexer');
const parser = require('./src/parser');
const interpreter = require('./src/interpreter');

const rl = require('readline');
const fs = require('fs');
const args = { type: 'console', file: '', showTime: false };

for (let i = 0; i<process.argv.length; i++) {
	let arg = process.argv[i];
	if (arg === '-c' || arg === '--console') args.type = 'console';
	if (arg === '-f' || arg === '--file') { args.type = 'file'; args.file = process.argv[i+1]; process.argv.splice(i+1, 1); }
	if (arg === '-t' || arg === '--time') args.showTime = true;
}

// console.log(args);

if (args.type === 'console') {
	const ir = rl.createInterface({ input: process.stdin, output: process.stdout });
	console.log(`Neon v${require("./package.json").version}
Copyright (c) 2022 Battledash-2 (& Neon)\n`);

	const qs = ()=>{ir.question('\u001b[1;97mneon \u001b[1;31m$ \u001b[0m', (r)=>{
		if (r === 'exit') return ir.close();
		if (args.showTime) console.time('Run Time');
		const res = new interpreter('runtime').eval(new parser(new lexer(r), 'runtime'), global);
		if (typeof res === 'number') console.log('\u001b[91m'+res+'\u001b[0m');
		if (typeof res === 'string') console.log('\u001b[92m"'+res+'"\u001b[0m');
		if (typeof res === 'boolean') console.log('\u001b[31m'+res+'\u001b[0m');
		if (typeof res === 'object') console.log(res);
		if (typeof res === 'undefined') console.log('\u001b[35mundefined\u001b[0m');
		if (args.showTime) console.timeEnd('Run Time');
		qs();
	});}
	qs();
} else if (args.type === 'file') {
	if (args.file === '' || args.file == null) throw 'Saw \'-f\' without a filename';
	if (!fs.existsSync(args.file)) throw `File '${args.file}' does not exist`;
	const content = fs.readFileSync(args.file);
	if (args.showTime) console.time('Run Time');
	new interpreter(args.file).eval(new parser(new lexer(content, args.file), args.file));
	if (args.showTime) console.timeEnd('Run Time');
}