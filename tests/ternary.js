module.exports = test => {
	test(`
	true ? 'HELLO' : 'BYE';
	`, 'HELLO');
	test(`
	false ? 'HELLO' : 'BYE';
	`, 'BYE');

	test(`
	32 > 10 ? 'HELLO' : 'BYE';
	`, 'HELLO');
	test(`
	32 < 10 ? 'HELLO' : 'BYE';
	`, 'BYE');
}