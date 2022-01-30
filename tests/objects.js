module.exports = test => {
	test(`
		({
			hello: 'pop',
		}).hello
	`,
	"pop");

	test(`
		let obj = {
			"poop": 32,
		}

		obj.poop
	`,
	32);

	// Nested
	test(`
		let obj = {
			"poop": {
				"A": 45
			},
		}

		obj.poop.A
	`,
	45);
}