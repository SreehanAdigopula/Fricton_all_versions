const {
    OAUTH_COOKIE_PREFIX,
    clearCookie,
    getClientId,
    getClientSecret,
    getOrigin,
    getOwnerEmail,
    html,
    parseCookies,
    redirect,
    setOwnerSession
} = require("../_auth");

module.exports = async function vercelAuthCallback(req, res) {
    const requestUrl = new URL(req.url, getOrigin(req));
    const code = requestUrl.searchParams.get("code");
    const state = requestUrl.searchParams.get("state");
    const error = requestUrl.searchParams.get("error");
    const cookies = parseCookies(req);
    const storedState = cookies[`${OAUTH_COOKIE_PREFIX}state`];
    const storedNonce = cookies[`${OAUTH_COOKIE_PREFIX}nonce`];
    const verifier = cookies[`${OAUTH_COOKIE_PREFIX}verifier`];

    if (error) {
        return redirect(res, "/index.html?auth=cancelled");
    }

    if (!code || !state || !storedState || state !== storedState || !verifier) {
        return html(res, 400, "<h1>Owner sign-in could not be verified.</h1><p>Please start again from the construction page.</p>");
    }

    try {
        const tokenData = await exchangeCodeForToken(code, verifier, getOrigin(req));
        validateIdToken(tokenData.id_token, storedNonce);
        const user = await fetchUserInfo(tokenData.access_token);
        if (!user.email_verified || String(user.email || "").trim().toLowerCase() !== getOwnerEmail()) {
            res.setHeader("Set-Cookie", clearedOAuthCookies());
            return redirect(res, "/index.html?auth=denied");
        }

        setOwnerSession(res, user);
        res.setHeader("Set-Cookie", [
            res.getHeader("Set-Cookie"),
            ...clearedOAuthCookies()
        ].flat());
        return redirect(res, "/friction_html.html");
    } catch (authError) {
        console.error("Vercel owner sign-in failed.", authError);
        return html(res, 500, "<h1>Owner sign-in failed.</h1><p>Try again in a minute.</p>");
    }
};

async function exchangeCodeForToken(code, verifier, origin) {
    const response = await fetch("https://api.vercel.com/login/oauth/token", {
        method: "POST",
        body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: getClientId(),
            client_secret: getClientSecret(),
            code,
            code_verifier: verifier,
            redirect_uri: `${origin}/api/auth/callback`
        })
    });

    if (!response.ok) {
        throw new Error(`Token exchange failed with ${response.status}`);
    }

    return response.json();
}

async function fetchUserInfo(accessToken) {
    const response = await fetch("https://api.vercel.com/login/oauth/userinfo", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`User info failed with ${response.status}`);
    }

    return response.json();
}

function validateIdToken(idToken, expectedNonce) {
    if (!idToken || !expectedNonce) {
        throw new Error("Missing ID token or nonce");
    }

    const [, encodedPayload] = String(idToken).split(".");
    if (!encodedPayload) {
        throw new Error("Invalid ID token");
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];

    if (payload.iss !== "https://vercel.com") {
        throw new Error("Unexpected ID token issuer");
    }

    if (!audience.includes(getClientId())) {
        throw new Error("Unexpected ID token audience");
    }

    if (payload.nonce !== expectedNonce) {
        throw new Error("Unexpected ID token nonce");
    }

    if (!payload.exp || payload.exp * 1000 < Date.now()) {
        throw new Error("Expired ID token");
    }
}

function clearedOAuthCookies() {
    return [
        clearCookie(`${OAUTH_COOKIE_PREFIX}state`),
        clearCookie(`${OAUTH_COOKIE_PREFIX}nonce`),
        clearCookie(`${OAUTH_COOKIE_PREFIX}verifier`)
    ];
}
