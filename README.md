# 🔆 Neon Lang 🟡
#### V2.0.0

## What is Neon? (ℹ)
### Neon is a public and open source language (under the MIT license ©).

## 📩 Installation 📉
### To install Neon:
1) First, run `git clone https://github.com/Battledash-2/Neon` to clone the source code
2) Second, create a Javascript file named `run.js`
3) In the file, require the lexer, parser and interpreter in `/src`.
4) To initiate, use `new Interpreter().eval(new Parser(new Lexer('ANY CODE HERE')));`

### Alternatively:
1) Clone the source code (like shown above)
2) Run `node . <MODE: [-f: File, -c: Console, Default: -c]> <MODE==FILE?FNAME: [-t: Show Exec Time]>`

## 📃 Todo 💹
- Everything is finished...

## 🏁 Finished 🔚
- [x] OOP support (still missing `extends` keyword) (Classes)
- [x] (...initial) (objects, array, negated sets, if statements, for/while, variables, scopes)

## 😎 Examples 🧪
- Number interpreter with a lexer and parser (`./examples/NumberInterpreter`)
- Mini-language / small lexer & parser-less language (`./examples/MiniLang`)
- Lambda functions (`./examples/LambdaFunctions`)