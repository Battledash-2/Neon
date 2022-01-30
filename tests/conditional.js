module.exports = test => {
	test(`
	let a = 42;
	let b = 53;

	if (a < b) {
		print("A LESS THAN B");
		'yez'
	} else {
		'no'
	}
	`, 'yez');

	test(`
	let a = 42;
	let b = 53;

	if (a > b) {
		print("A LESS THAN B");
		'yez'
	} else {
		'no'
	}
	`, 'no');
}