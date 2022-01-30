module.exports = test => {
	test(`
	for (let i = 0; i < 5; i = i + 1) {
		i
	}
	`, 5);
}