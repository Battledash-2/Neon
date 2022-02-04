module.exports = test => {
	test(`
	try {
		poo
	} catch(error) {
		print("EO", error);
	}
	"hi";
	`, "hi");
}