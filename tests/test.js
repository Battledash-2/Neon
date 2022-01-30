const assert = require('assert');

const Interpreter = require('../src/interpreter');
const Lexer = require('../src/lexer');
const Parser = require('../src/parser');

const interpreter = new Interpreter();

function test(code, expec) {
    const ast = new Parser(new Lexer(code));
    assert.strictEqual(interpreter.eval(ast), expec);
}

const tests = [
    require('./numbers'),
    require('./math-operations'),
    require('./variables'),
    require('./native-functions'),
    require('./user-functions'),
    require('./variable-assign'),
    require('./linked'),
];
const manualTests = [
    23
];

for (let t of tests) {
    t(test);
}
for (let t of manualTests) {
    console.log('Manual test,', interpreter.eval(t));
}

console.log('All assertions succeeded.');