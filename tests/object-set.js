module.exports = test => {
	test(`
	let obj = {
		a: 24
	}

	obj.a = 42

	obj.a
	`, 42);

	test(`
	let obj = {
		a: {
			c: 23
		}
	}

	obj.a.c = 42

	obj.a.c
	`, 42);

	test(`
	let obj = {
		a: {
			c: 23
		}
	}

	obj.a['c'] = 42

	obj.a.c
	`, 42);

	test(`
	let obj = {
		a: {
			c: 23
		}
	}

	obj['a']['c'] = 42

	obj.a.c
	`, 42);
}