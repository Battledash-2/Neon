module.exports = test => {
	test(`
	for (let i = 0; i < 5; i++) {
		i
	}
	`, 4);
}