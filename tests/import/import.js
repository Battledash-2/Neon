module.exports = test => {
	test(`
	let importme = {
		popVal: 'pop'
	}
	importme.popVal
	`, "pop");
}