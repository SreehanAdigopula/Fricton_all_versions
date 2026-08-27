const { clearAuthCookies, secureHeaders } = require("../_auth");

module.exports = async function signOut(req, res) {
    clearAuthCookies(res);
    res.writeHead(204, secureHeaders());
    res.end();
};
