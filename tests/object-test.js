module.exports = test => {
	test(`
	let myObj = {
		funnyFunc: fun () {
			'poop';
		}
	}
	myObj.funnyFunc();
	`, 'poop');

	test(`
	let myObj = {
		funnyFunc: fun (a) {
			'poop'+a;
		}
	}
	let b = 'poop'
	myObj.funnyFunc(b);
	`, 'pooppoop');

	test(`
	let myObj = {
		funnyFunc: fun (a) {
			'poop'+a;
		}
	}
	(fun () {
		let c = 's'
		print(myObj.funnyFunc('s'))
	})();
	`, 'poops');
}