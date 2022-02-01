module.exports = test => {
	test(`
	let a = 'foo';
	fun b() {
		return a+'foo';
		a = 'bar';
	}
	a;
	b();
	`, 'foofoo');
}