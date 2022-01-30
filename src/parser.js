const StringHandle = require('./escapes');

module.exports = class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.next = this.tokens.nextToken();

        return this.program();
    }

    stringStatement() {
        let s = this.next;
        s = {
            type: 'STRING',
            value: StringHandle(s.value.slice(1, -1))
        };
        this.advance('STRING');
        if (this.next?.type === 'OBJ_SEPERATOR') {
            return this.linked(s);
        }
        return s;
    }

    numberStatement() {
        let r = this.next;
        r.value = Number(r?.value);
        this.advance('NUMBER');
        if (this.next?.type === 'OBJ_SEPERATOR') {
            return this.linked(r);
        }
        return r;
    }

    unary() {
        let op, num;

        if (this.next?.type === 'OPERATOR' && this.tokens.isAdditive(this.next.value)) {
            op = this.next.value;
            this.advance('OPERATOR');
            num = this.statement();
        }

        if (op != null) return {
            type: 'UNARY',
            operator: op,
            value: num,
        }

        return this.primaryStatement();
    }

    variableExpression() {
        if (this.next?.type !== 'DEFINE') return this.unary();
        
        this.advance('DEFINE');
        let name = this.next;
        this.advance('IDENTIFIER');
        
        if (this.next?.type === 'ASSIGNMENT') {
            this.advance('ASSIGNMENT');
            let value = this.statement();

            return {
                type: 'DEFINE',
                name,
                value,
            }
        }
        return name;
    }

    exponentExpression() {
        return this.binaryExpression('variableExpression', 'isPower');
    }

    multiplicationExpression() {
        return this.binaryExpression('exponentExpression', 'isMultiplicative');
    }
    
    additionExpression() {
        return this.binaryExpression();
    }

    binaryExpression(par='multiplicationExpression', test='isAdditive') {
        let left = this[par]();

        while (this.next?.type === 'OPERATOR' && this.tokens[test](this.next.value)) {
            let op = this.next.value;
            this.advance('OPERATOR');
            let right = this[par]();

            left = {
                type: 'BINARY',
                operator: op,
                left,
                right,
            }
        }

        return left;
    }

    blockStatement() {
        let body;
        if (this.next?.type === 'LBLOCK') {
            this.advance('LBLOCK', '{');
            body = this.statementList('RBLOCK');
            this.advance('RBLOCK', '}');
        } else {
            body = this.statement();
        }

        return {
            type: 'BLOCK',
            body,
        }
    }

    parenthesizedExpression() {
        this.advance('LPAREN');
        const body = this.statement();
        this.advance('RPAREN');

        switch (this.next?.type) {
            case 'LPAREN':
                return this.functionCall(body);
            case 'OBJ_SEPERATOR':
                return this.linked(body);
        }

        return body;
    }

    argumentList(stopAt='RPAREN') {
        let args = [];
        if (this.next?.type !== stopAt) {
            do {
                if (this.next?.type === stopAt) break;
                args.push(this.statement());
            } while (this.next?.type === 'SEPERATOR' && this.advance('SEPERATOR'));
        }
        return args;
    }

    functionCall(name) {
        this.advance('LPAREN', '(');
        const args = this.argumentList('RPAREN');
        this.advance('RPAREN', ')');

        return {
            type: 'FUNCTION_CALL',
            name,
            arguments: args,
        }
    }

    assignment(name) {
        this.advance('ASSIGNMENT');
        let value = this.statement();

        return {
            type: 'ASSIGN',
            name,
            value
        };
    }

    linked(w) {
        this.advance('OBJ_SEPERATOR', '.');
        let other = this.identifier();
        
        return {
            type: 'LINKED',
            with: w,
            other,
        }
    }

    identifier() {
        let identifier = this.next;
        this.advance('IDENTIFIER');
        
        switch (this.next?.type) {
            case 'LPAREN':
                return this.functionCall(identifier);
            case 'ASSIGNMENT':
                return this.assignment(identifier);
            case 'OBJ_SEPERATOR':
                return this.linked(identifier);
        }

        return identifier;
    }

    functionDefinition() {
        // Get function name
        this.advance('F_DEFINE');
        let name = this.next;
        this.advance();

        // Get the arguments
        if (name?.type !== 'LPAREN') {
            this.advance('LPAREN');
        } else {
            name = null;
        }
        let argNames = this.argumentList('RPAREN');
        this.advance('RPAREN');

        // Get the function body
        const body = this.blockStatement();

        return {
            type: 'FUNCTION_DEFINITION',
            name,
            arguments: argNames,
            body,
        };
    }

    primaryStatement() {
        switch (this.next?.type) {
            case 'EXPR_END':
                this.advance('EXPR_END');
                return { type: 'EMPTY' };
            case 'NUMBER':
                return this.numberStatement();
            case 'STRING':
                return this.stringStatement();
            case 'LBLOCK':
                return this.blockStatement();
            case 'LPAREN':
                return this.parenthesizedExpression();
            case 'OPERATOR':
                return this.unary();
            case 'IDENTIFIER':
                return this.identifier();
            case 'F_DEFINE':
                return this.functionDefinition();
            default:
                const r = this.next;
                this.advance();
                return r;
        }
    }

    statement() {
        return this.additionExpression();
        // switch (this.next?.type) {
        //     case 'NUMBER':
                
        //     case 'OPERATOR':
        //         return this.unary();
        //     default:
        //         return this.primaryStatement();
        // }
    }

    statementList(endOn) {
        let res = [];

        while (this.next != null && this.next.type != endOn) {
            res.push(this.statement());
            if (this.next?.type === 'EXPR_END') this.advance('EXPR_END', ';');
        }

        return res;
    }

    program() {
        return {
            type: 'PROGRAM',
            body: this.statementList()
        };
    }

    advance(type, lk) {
        lk = lk ?? type;
        if (type != null) {
            if (this.next == null) throw new SyntaxError(`Input abruptly ended while expecting '${lk}'`);
            if (this.next.type !== type) throw new SyntaxError(`Unexpected token '${this.next.value}': Expected '${lk}'`);
        }

        this.next = this.tokens.nextToken();
        return this.next;
    }
}