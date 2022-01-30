module.exports = test => {
	test(`
	let a = 53 // using 'const' would error
	a = 2
	`, 2);

	test(`
	const obj = {
		constant: 'maybe'
	}
	obj.constant = 'o'
	`, 'o');
}