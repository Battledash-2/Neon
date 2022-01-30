module.exports = test => {
	test(`
	let myObj = {
		funnyFunc: fun () {
			'poop';
		}
	}
	myObj.funnyFunc();
	`, 'poop');
}