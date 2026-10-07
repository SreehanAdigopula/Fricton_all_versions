import { createReadStream, lstatSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";

const root = resolve(process.cwd());
const port = 4173;
const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
const publicFiles = new Set([
    "app-rules.html",
    "favicon.svg",
    "fictioncss.css",
    "friction-logo.svg",
    "frictionJS.js",
    "friction_html.html",
    "policies.html",
    "system-builder-testing.html"
]);
const routeAliases = new Map([
    ["/", "friction_html.html"],
    ["/index.html", "friction_html.html"],
    ["/system-builder.html", "system-builder-testing.html"]
]);
const mimeTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
};

const securityHeaders = {
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; frame-src https://www.youtube.com https://www.youtube-nocookie.com https://open.spotify.com; connect-src 'self' https://worldtimeapi.org; media-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
};

const server = createServer((request, response) => {
    if (!allowedHosts.has(String(request.headers.host || "").toLowerCase())) {
        response.writeHead(403, securityHeaders);
        response.end("Forbidden");
        return;
    }

    let requestPath;
    try {
        requestPath = decodeURIComponent(new URL(request.url || "/", `http://127.0.0.1:${port}`).pathname);
    } catch {
        response.writeHead(400, securityHeaders);
        response.end("Bad request");
        return;
    }

    const fileName = routeAliases.get(requestPath) || requestPath.slice(1);
    if (!publicFiles.has(fileName) || (requestPath !== `/${fileName}` && !routeAliases.has(requestPath))) {
        response.writeHead(404, securityHeaders);
        response.end("Not found");
        return;
    }

    const filePath = resolve(root, fileName);
    try {
        if (!lstatSync(filePath).isFile()) {
            response.writeHead(404, securityHeaders);
            response.end("Not found");
            return;
        }
    } catch {
        response.writeHead(404, securityHeaders);
        response.end("Not found");
        return;
    }

    const stream = createReadStream(filePath);
    stream.on("open", () => {
        response.writeHead(200, {
            ...securityHeaders,
            "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream"
        });
        stream.pipe(response);
    });
    stream.on("error", () => {
        if (response.headersSent) {
            response.destroy();
        } else {
            response.writeHead(404, securityHeaders);
            response.end("Not found");
        }
    });
});

server.listen(port, "127.0.0.1", () => {
    process.stdout.write(`Friction test server listening on http://127.0.0.1:${port}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => server.close(() => process.exit(0)));
}
