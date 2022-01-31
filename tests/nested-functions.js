module.exports = test => {
	test(`
	fun myFunc(arg) {
		fun fun2(arg) {
			arg + "poop";
		}
		fun2(arg);
	}

	myFunc("lala");
	`, "lalapoop");

	test(`
	fun myFunc() {
		fun () {
			'poop';
		}
	}
	myFunc()();
	`, 'poop');
}