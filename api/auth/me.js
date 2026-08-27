const { getOwnerSession, secureHeaders } = require("../_auth");

module.exports = async function getOwner(req, res) {
    const session = getOwnerSession(req);
    res.writeHead(session ? 200 : 401, secureHeaders({ "Content-Type": "application/json; charset=utf-8" }));
    res.end(JSON.stringify({
        authenticated: Boolean(session),
        user: session ? { email: session.email, name: session.name } : null
    }));
};
