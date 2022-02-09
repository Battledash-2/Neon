module.exports = test => {
	test(`
	try {
		throw "dsad";
	} catch(e) {
		print(e);
	}
	`, "[Error]: dsad (runtime:2:7)");
}