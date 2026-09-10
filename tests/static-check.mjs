import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const failures = [];
const requiredFiles = [
    "friction_html.html",
    "frictionJS.js",
    "fictioncss.css",
    "friction-logo.svg",
    "favicon.svg",
    "app-rules.html",
    "policies.html",
    "system-builder-testing.html",
    "vercel.json"
];
const htmlFiles = ["friction_html.html", "app-rules.html", "policies.html", "system-builder-testing.html"];

function check(condition, message) {
    if (!condition) failures.push(message);
}

for (const file of requiredFiles) {
    check(existsSync(resolve(root, file)), `Missing required file: ${file}`);
}

for (const file of htmlFiles) {
    const html = readFileSync(resolve(root, file), "utf8");
    const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    check(duplicates.length === 0, `${file} has duplicate IDs: ${[...new Set(duplicates)].join(", ")}`);

    for (const match of html.matchAll(/\s(?:src|href)=["']([^"']+)["']/g)) {
        const rawTarget = match[1];
        if (/^(?:https?:|#|mailto:|tel:|data:)/.test(rawTarget)) continue;
        const target = rawTarget.split(/[?#]/)[0];
        if (!target || extname(target) === "") continue;
        check(existsSync(resolve(root, target)), `${file} links to missing local file: ${target}`);
    }
}

const mainHtml = readFileSync(resolve(root, "friction_html.html"), "utf8");
check(/id="tabMotivation"[^>]*disabled/.test(mainHtml), "Top System Builder control must remain disabled.");
check(/id="motivationBtn"[^>]*disabled/.test(mainHtml), "Focus System Builder control must remain disabled.");
check(mainHtml.includes("playlist-only-20260909"), "Main assets must use the current cache-busting version.");
check(mainHtml.includes("YouTube links must be public playlists"), "Playlist-only YouTube guidance is missing.");

const policies = readFileSync(resolve(root, "policies.html"), "utf8");
check(policies.includes("Regular videos, auto-generated YouTube mixes"), "Policies must match playlist-only validation.");

const readme = readFileSync(resolve(root, "README.md"), "utf8");
check(readme.includes("remains closed"), "README must identify System Builder as closed.");

const vercel = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8"));
const headerRoute = vercel.routes?.find((route) => route.headers);
const headers = headerRoute?.headers || {};
check(headers["X-Content-Type-Options"] === "nosniff", "Vercel must set nosniff.");
check(headers["X-Frame-Options"] === "DENY", "Vercel must deny framing.");
check(headers["Referrer-Policy"] === "strict-origin-when-cross-origin", "Vercel referrer policy must support safe YouTube embeds.");
check(headers["Content-Security-Policy"]?.includes("object-src 'none'"), "Vercel CSP must block objects.");
check(vercel.routes?.some((route) => route.src?.includes("system-builder") && route.dest === "/system-builder-testing.html"), "Production System Builder route must show the testing page.");
check(vercel.routes?.some((route) => route.src?.includes("access-control") && route.status === 404), "Legacy auth/config routes must stay blocked.");

if (failures.length) {
    console.error(`Static release checks failed (${failures.length}):`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
}

console.log(`Static release checks passed (${requiredFiles.length} required files, ${htmlFiles.length} HTML pages).`);
