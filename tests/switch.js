module.exports = test => {
	test(`
	let age = 5;
	switch(age) {
		case 5:
			print("5 year old");
			break;
		case 2:
			print("2 year old");
			break;
		case 20:
			print("2*10 year old");
			break;
		default:
			print("idk")
	}
	`, "5 year old");
}