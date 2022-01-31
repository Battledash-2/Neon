module.exports = test => {
    test(`
    let a = 35;
    a = fun() {53}
    a(); // not including this ';' could cause issues
    (fun(a) {a+1})(53)
    `,
    54);
}