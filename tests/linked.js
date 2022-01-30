module.exports = test => {
    test(`
        "43".number;
    `, 43);

    test(`
        let str = "43";
		str.number
    `, 43);
}