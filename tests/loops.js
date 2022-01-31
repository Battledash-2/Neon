module.exports = test => {
	test(`
	for (let i = 0; i < 5; i++) {
		i
	}
	`, 4);

	test(`
	let r = null;
	for (let i = 0; i < 5; i++) {
		r = i;
		if (i == 2) {
			break;
			r = 99
		}
	}
	r
	`, 2);
}