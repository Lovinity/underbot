module.exports = async function listen (req, res) {
    return res.view('pages/home', { layout: 'layouts/main' });
}