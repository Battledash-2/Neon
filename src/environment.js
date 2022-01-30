class Environment {
    constructor(env, par) {
        this.record = env;
        this.parent = par;
    }

    define(name, value) {
        this.record[name] = value;
        return value;
    }

    assign(name, value) {
        this.resolve(name).record[name] = value;
        return value;
    }

    lookup(name, pos) {
        return this.resolve(name, pos).record[name];
    }

    resolve(name, pos) {
        if (this.record.hasOwnProperty(name)) return this;
        if (this.parent == null) throw new ReferenceError(`Could not resolve variable '${name}' (${pos.filename}:${pos.line}:${pos.cursor})`);
        if (this.parent.record.hasOwnProperty(name)) return this.parent;

        return this.parent.resolve(name, pos);
    }
}

module.exports = Environment;