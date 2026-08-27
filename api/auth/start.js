const {
    OAUTH_COOKIE_PREFIX,
    codeChallenge,
    cookie,
    getClientId,
    getOrigin,
    html,
    isOAuthConfigured,
    randomString,
    redirect,
    secureHeaders
} = require("../_auth");

module.exports = async function startVercelAuth(req, res) {
    if (!isOAuthConfigured()) {
        return html(res, 503, setupMessage());
    }

    const origin = getOrigin(req);
    const state = randomString();
    const nonce = randomString();
    const verifier = randomString(48);
    const params = new URLSearchParams({
        client_id: getClientId(),
        response_type: "code",
        redirect_uri: `${origin}/api/auth/callback`,
        scope: "openid email profile",
        state,
        nonce,
        code_challenge: codeChallenge(verifier),
        code_challenge_method: "S256"
    });

    res.setHeader("Set-Cookie", [
        cookie(`${OAUTH_COOKIE_PREFIX}state`, state, { maxAge: 600 }),
        cookie(`${OAUTH_COOKIE_PREFIX}nonce`, nonce, { maxAge: 600 }),
        cookie(`${OAUTH_COOKIE_PREFIX}verifier`, verifier, { maxAge: 600 })
    ]);
    res.writeHead(302, secureHeaders({ Location: `https://vercel.com/oauth/authorize?${params}` }));
    res.end();
};

function setupMessage() {
    return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Owner Sign In Setup Needed</title></head>
<body style="font-family: system-ui, sans-serif; max-width: 680px; margin: 64px auto; line-height: 1.5;">
<h1>Owner sign-in is not configured yet.</h1>
<p>Create a Vercel Integration for this project, then add these Production environment variables:</p>
<ul>
<li><code>VERCEL_OAUTH_CLIENT_ID</code></li>
<li><code>VERCEL_OAUTH_CLIENT_SECRET</code></li>
<li><code>FRICTION_COOKIE_SECRET</code></li>
<li><code>FRICTION_OWNER_EMAIL</code></li>
</ul>
<p>The callback URL should be <code>/api/auth/callback</code> on this Vercel domain.</p>
<p><a href="/index.html">Back to construction page</a></p>
</body>
</html>`;
}
