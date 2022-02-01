module.exports = test => {
	test(`
	import "tests/imports.neo";
	imports.foo;
	`, 'bar');
}