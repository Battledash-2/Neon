const testCode = `
if (isNaN(current.number) == false) {
	// is number
	push(current.number);
}
`; // 1+1-3

const Lexer = require('./lexer');
const tokens = new Lexer(testCode);

const Parser = require('./parser');
const ast = new Parser(tokens);

console.log(JSON.stringify(ast, null, 4));