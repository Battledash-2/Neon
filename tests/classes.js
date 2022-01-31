module.exports = test => {
	test(`
	class MyClass() {
		let a = 5;
	}
	let myClass = new MyClass();
	myClass.a;
	`, 5);

	test(`
	class MyClass() {
		fun idk() {
			23
		}
	}
	let myclass = new MyClass();
	myclass.idk();
	`, 23);

	test(`
	class MyClass(a) {
		fun idk2() {
			a;
		}
	}
	let myclass = new MyClass("classes!");
	myclass.idk2();
	`, "classes!");

	test(`
	let b = 'c';
	class MyClass(a) {
		fun idk2() {
			a;
			print(b)
		}
	}
	let myclass = new MyClass("classes!");
	myclass.idk2();
	`, "c");
}