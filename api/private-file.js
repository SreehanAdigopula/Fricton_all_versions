const fs = require("node:fs");
const path = require("node:path");
const { getOwnerSession, redirect, secureHeaders } = require("./_auth");

const PRIVATE_FILES = new Map([
    ["friction_html.html", "text/html; charset=utf-8"],
    ["frictionJS.js", "application/javascript; charset=utf-8"],
    ["system-builder.html", "text/html; charset=utf-8"],
    ["system-builder.js", "application/javascript; charset=utf-8"],
    ["system-builder.css", "text/css; charset=utf-8"],
    ["access-control.js", "application/javascript; charset=utf-8"],
    ["supabaseConfig.js", "application/javascript; charset=utf-8"],
    ["supabase_schema.sql", "text/plain; charset=utf-8"]
]);

module.exports = async function servePrivateFile(req, res) {
    const requestUrl = new URL(req.url, "https://friction.local");
    const file = requestUrl.searchParams.get("file");
    const contentType = PRIVATE_FILES.get(file);

    if (!contentType) {
        res.writeHead(404, secureHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
        res.end("Not found");
        return;
    }

    if (!getOwnerSession(req)) {
        if (file.endsWith(".html")) {
            return redirect(res, "/index.html");
        }

        res.writeHead(404, secureHeaders({ "Content-Type": "text/plain; charset=utf-8" }));
        res.end("Not found");
        return;
    }

    const fullPath = path.join(process.cwd(), file);
    const body = fs.readFileSync(fullPath);
    res.writeHead(200, secureHeaders({
        "Content-Type": contentType,
        "Cache-Control": "private, no-store"
    }));
    res.end(body);
};
