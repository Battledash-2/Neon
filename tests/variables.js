module.exports = t => {
    // get
    t(`
    VER
    `, '1.0.0');

    // set
    t(`
    var e = 'poop'
    e
    `, 'poop');
}