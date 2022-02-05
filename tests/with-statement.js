module.exports = test => {
	test(`
		let obj = {
			poop: 'pee',
		}
		with(obj) {
			poop
		}
	`, 'pee');
};