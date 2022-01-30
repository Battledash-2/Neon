module.exports = test => {
	test(`
	let str = "hello hey"
	print(str.split(" "))
	`, 'hello,hey');

	test(`
	let myObj = {
		hello: 'poop'
	}
	myObj["hello"]
	`, 'poop');
}