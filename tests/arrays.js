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

	test(`
	let array = [32, 19];
	array.push(5);
	print(array); // [32, 19, 5]
	array.splice(1, 1); // remove '19' ([32, 5])
	print(array);
	`, "32,5")
}