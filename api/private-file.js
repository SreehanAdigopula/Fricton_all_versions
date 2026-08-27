const fs = require("node:fs");
const path = require("node:path");
const { getOwnerSession, redirect, secureHeaders } = require("./_auth");

const PRIVATE_FILES = new Map([
    ["friction_html.html", { contentType: "text/html; charset=utf-8", path: path.join(process.cwd(), "friction_html.html") }],
    ["frictionJS.js", { contentType: "application/javascript; charset=utf-8", path: path.join(process.cwd(), "frictionJS.js") }],
    ["system-builder.html", { contentType: "text/html; charset=utf-8", path: path.join(process.cwd(), "system-builder.html") }],
    ["system-builder.js", { contentType: "application/javascript; charset=utf-8", path: path.join(process.cwd(), "system-builder.js") }],
    ["system-builder.css", { contentType: "text/css; charset=utf-8", path: path.join(process.cwd(), "system-builder.css") }],
    ["access-control.js", { contentType: "application/javascript; charset=utf-8", path: path.join(process.cwd(), "access-control.js") }],
    ["supabaseConfig.js", { contentType: "application/javascript; charset=utf-8", path: path.join(process.cwd(), "supabaseConfig.js") }],
    ["supabase_schema.sql", { contentType: "text/plain; charset=utf-8", path: path.join(process.cwd(), "supabase_schema.sql") }]
]);

module.exports = async function servePrivateFile(req, res) {
    const requestUrl = new URL(req.url, "https://friction.local");
    const file = requestUrl.searchParams.get("file");
    const entry = PRIVATE_FILES.get(file);

    if (!entry) {
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

    const body = fs.readFileSync(entry.path);
    res.writeHead(200, secureHeaders({
        "Content-Type": entry.contentType,
        "Cache-Control": "private, no-store"
    }));
    res.end(body);
};
