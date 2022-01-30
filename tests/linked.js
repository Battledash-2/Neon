module.exports = test => {
    test(`
        "43".number;
    `, 43);

    test(`
        "43".someFunction('hello');
    `, 'hello');
}