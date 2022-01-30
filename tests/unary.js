module.exports = test => {
	test(`
	let a = true;
	!a
	`, false);

	test(`
	let a = "hello";
	!isNaN(a.number);
	`, false);
}