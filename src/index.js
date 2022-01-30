const testCode = `
while (let a = 0; a < 5; a = a + 1;) {
	print('a')
}
`; // 1+1-3

const Lexer = require('./lexer');
const tokens = new Lexer(testCode);

const Parser = require('./parser');
const ast = new Parser(tokens);

console.log(JSON.stringify(ast, null, 4));