module.exports = test => {
    test(`
    fun square(num) {
        num * num;
    }
    square(2);
    `, 4);

    test(`
        let a = 5;
        fun adv() {
            a + 10; // 15
        }
        adv();
    `, 15);

	test(`
        fun test() {
			return {
				e: 'poop'
			}
		}
		test().es;
    `, 'poop');
}