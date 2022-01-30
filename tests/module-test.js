module.exports = test => {
	// math
	test(`
	Math.PI
	`, Math.PI);

	test(`
	Math.pow(5, 3)
	`, Math.pow(5, 3));

	test(`
	let a = 7
	let b = 2
	Math.pow(a, b);
	`, Math.pow(7, 2));

	// process
	// test(`
	// // process.exit(5)
	// `, undefined);
}