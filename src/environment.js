class Environment {
    constructor(env, par, con = {}) {
        this.record = env;
        this.parent = par;
		this.constants = con;
	}

    define(name, value, _pos, constant) {
        this.record[name] = value;
		if (constant) {this.constants[name] = constant;}
        return value;
    }

    assign(name, value, pos) {
		let env = this.resolve(name, pos);
		if (this.isConstant(name, pos)) throw new TypeError(`Cannot overwrite constant variable '${name}' (${pos.filename}:${pos.line}:${pos.cursor})`);
		this.resolve(name, pos).record[name] = value;
        return value;
    }

    lookup(name, pos) {
		return this.resolve(name, pos).record[name];
    }

	isConstant(name, pos) {
		let env = this.resolve(name, pos);
		if (env.constants.hasOwnProperty(name)) {return true;}
	}

	varExists(name) {
		if (this.record.hasOwnProperty(name)) return true;
		if (this.parent == null) return false;

		return this.parent.varExists(name);
	}

    resolve(name, pos) {
        if (this.record.hasOwnProperty(name)) return this;
        if (this.parent == null) throw new ReferenceError(`Could not resolve variable '${name}' (${pos.filename}:${pos.line}:${pos.cursor})`);
        if (this.parent.record.hasOwnProperty(name)) return this.parent;

        return this.parent.resolve(name, pos);
    }
}

module.exports = Environment;