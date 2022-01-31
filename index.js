const testCode = `
class MyClass() {
	let a = 5;
}
let myclass = new MyClass();
myclass.a;
`; // 1+1-3

const Lexer = require('./src/lexer');
const tokens = new Lexer(testCode);

const Parser = require('./src/parser');
const ast = new Parser(tokens);

console.log(JSON.stringify(ast, null, 4));