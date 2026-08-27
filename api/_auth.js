const crypto = require("node:crypto");

const AUTH_COOKIE = "friction_vercel_owner";
const OAUTH_COOKIE_PREFIX = "friction_vercel_oauth_";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getOrigin(req) {
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    return `${protocol}://${host}`;
}

function getOwnerEmail() {
    return (process.env.FRICTION_OWNER_EMAIL || "asreehan4u@gmail.com").trim().toLowerCase();
}

function getClientId() {
    return process.env.VERCEL_OAUTH_CLIENT_ID || process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID || "";
}

function getClientSecret() {
    return process.env.VERCEL_OAUTH_CLIENT_SECRET || process.env.VERCEL_APP_CLIENT_SECRET || "";
}

function getCookieSecret() {
    return process.env.FRICTION_COOKIE_SECRET || getClientSecret();
}

function isOAuthConfigured() {
    return Boolean(getClientId() && getClientSecret() && getCookieSecret());
}

function secureHeaders(extra = {}) {
    return {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "same-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
        "Cache-Control": "no-store",
        ...extra
    };
}

function parseCookies(req) {
    return String(req.headers.cookie || "")
        .split(";")
        .map(cookie => cookie.trim())
        .filter(Boolean)
        .reduce((cookies, cookie) => {
            const separator = cookie.indexOf("=");
            if (separator === -1) return cookies;
            const name = cookie.slice(0, separator);
            const value = cookie.slice(separator + 1);
            cookies[name] = decodeURIComponent(value);
            return cookies;
        }, {});
}

function base64Url(input) {
    return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input) {
    return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value) {
    return crypto.createHmac("sha256", getCookieSecret()).update(value).digest("base64url");
}

function createSignedValue(payload) {
    const body = base64Url(JSON.stringify(payload));
    return `${body}.${sign(body)}`;
}

function readSignedValue(value) {
    if (!value || !getCookieSecret()) return null;
    const [body, signature] = String(value).split(".");
    if (!body || !signature) return null;
    const expected = sign(body);
    const actual = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actual.length !== expectedBuffer.length || !crypto.timingSafeEqual(actual, expectedBuffer)) {
        return null;
    }

    try {
        const payload = JSON.parse(fromBase64Url(body));
        if (!payload.exp || payload.exp < Date.now()) return null;
        return payload;
    } catch (error) {
        return null;
    }
}

function cookie(name, value, options = {}) {
    const parts = [`${name}=${encodeURIComponent(value)}`];
    parts.push("Path=/");
    parts.push("HttpOnly");
    parts.push("Secure");
    parts.push("SameSite=Lax");
    if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
    return parts.join("; ");
}

function clearCookie(name) {
    return cookie(name, "", { maxAge: 0 });
}

function getOwnerSession(req) {
    const cookies = parseCookies(req);
    const session = readSignedValue(cookies[AUTH_COOKIE]);
    if (!session || String(session.email || "").toLowerCase() !== getOwnerEmail()) {
        return null;
    }
    return session;
}

function setOwnerSession(res, user) {
    const email = String(user.email || "").trim().toLowerCase();
    const session = createSignedValue({
        email,
        name: user.name || user.preferred_username || "Friction Owner",
        sub: user.sub || "",
        exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000
    });
    res.setHeader("Set-Cookie", cookie(AUTH_COOKIE, session, { maxAge: SESSION_MAX_AGE_SECONDS }));
}

function clearAuthCookies(res) {
    res.setHeader("Set-Cookie", [
        clearCookie(AUTH_COOKIE),
        clearCookie(`${OAUTH_COOKIE_PREFIX}state`),
        clearCookie(`${OAUTH_COOKIE_PREFIX}nonce`),
        clearCookie(`${OAUTH_COOKIE_PREFIX}verifier`)
    ]);
}

function randomString(byteLength = 32) {
    return crypto.randomBytes(byteLength).toString("base64url");
}

function codeChallenge(verifier) {
    return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function redirect(res, location, status = 302) {
    res.writeHead(status, secureHeaders({ Location: location }));
    res.end();
}

function html(res, status, content) {
    res.writeHead(status, secureHeaders({ "Content-Type": "text/html; charset=utf-8" }));
    res.end(content);
}

module.exports = {
    AUTH_COOKIE,
    OAUTH_COOKIE_PREFIX,
    SESSION_MAX_AGE_SECONDS,
    getOrigin,
    getOwnerEmail,
    getClientId,
    getClientSecret,
    isOAuthConfigured,
    secureHeaders,
    parseCookies,
    cookie,
    clearCookie,
    getOwnerSession,
    setOwnerSession,
    clearAuthCookies,
    randomString,
    codeChallenge,
    redirect,
    html
};
