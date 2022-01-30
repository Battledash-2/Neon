module.exports = test => {
	test(`
	let myArray = [23, 12, "HELLO", 32];

	myArray[3]
	`, 32);

	test(`
	let myArray = [23, 12, "HELLO", 32];

	myArray[1]
	`, 12);

	test(`
	let myArray = [23, 12, "HELLO", 32];

	myArray[1] = 55
	myArray[1]
	`, 55);
}