module.exports = test => {
	test(`
	let importz = import "tests/imports.neo";
	importz.gibdu;
	`, 'bar');
}