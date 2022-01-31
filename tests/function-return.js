module.exports = test => {
	test(`
	let a = 'foo';
	fun b() {
		return 'e' + a;
		a = 'bar';
	}
	a;
	b();
	print(a);
	`, 'foo');
}