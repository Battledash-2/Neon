module.exports = test => {
	test(`
	let a = 53 // using 'const' would error
	a = 2
	`, 2);
}