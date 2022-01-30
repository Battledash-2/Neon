module.exports = test => {
	test(`
		let b = 4;
		b *= 2;
		b
	`, 8);

	test(`
		let b = 5
		b++
	`, 6);
}