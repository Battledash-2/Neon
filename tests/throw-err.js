module.exports = test => {
	test(`
	try {
		throw "dsad";
	} catch(e) {
		print("ERROR:", e);
	}
	`, "ERROR: dsad (runtime:2:7)");
}