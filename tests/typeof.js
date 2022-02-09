module.exports = test => {
	test(`
	typeof {};
	`, 'object');

	test(`
	typeof [];
	`, 'array');

	test(`
	typeof "";
	`, 'string');

	test(`
	typeof 42;
	`, 'number');

	test(`
	typeof true;
	`, 'boolean');

	test(`
	typeof null;
	`, 'undefined');
}