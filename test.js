const testCode = `
let age = 5;
switch(age) {
	case 5 {
		print("5 year old");
		break;
	}
	case 2 {
		print("2 year old");
		break;
	}
	case 20 {
		print("2*10 year old");
		break;
	}
}
`; // 1+1-3

const Lexer = require('./src/lexer');
const tokens = new Lexer(testCode);

const Parser = require('./src/parser');
const ast = new Parser(tokens);

console.log(JSON.stringify(ast, null, 4));