# ๐ Neon Lang ๐ก
#### V2.1.2

## What is Neon? (โน)
### Neon is a public and open source language (under the MIT license ยฉ).

## ๐ฉ Installation ๐
### To install Neon:
1) First, run `git clone https://github.com/Battledash-2/Neon` to clone the source code
2) Second, create a Javascript file named `run.js`
3) In the file, require the lexer, parser and interpreter in `/src`.
4) To initiate, use `new Interpreter().eval(new Parser(new Lexer('ANY CODE HERE')));`

### Alternatively:
1) Clone the source code (like shown above)
2) Run `node . <MODE: [-f: File, -c: Console, Default: -c]> <MODE==FILE?FNAME: [-t: Show Exec Time]>`

## ๐ Todo ๐น
- Proxies (like the Javascript `new Proxy(<OBJECT>, <PROXY>))` and the Lua `setmetatable(<OBJECT>, <PROXY>)`) 
- ObjectPrototype.defineProperty (`<OBJECT>.defineProperty(<NAME>, <FAKE-ISH PROXY: VALUE>)`)

## ๐ Finished ๐
- [x] OOP support (still missing `extends` keyword) (Classes)
- [x] (...initial) (objects, array, negated sets, if statements, for/while, variables, scopes)

## ๐ Examples ๐งช
- Number interpreter with a lexer and parser (`./examples/NumberInterpreter`)
- Mini-language / small lexer & parser-less language (`./examples/MiniLang`)
- Lambda functions (`./examples/LambdaFunctions`)