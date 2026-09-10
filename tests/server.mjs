import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());
const port = 4173;
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
    const requestPath = new URL(request.url || "/", "http://127.0.0.1").pathname;
    const routePath = requestPath === "/" || requestPath === "/index.html"
        ? "/friction_html.html"
        : requestPath;
    const relativePath = normalize(decodeURIComponent(routePath)).replace(/^([/\\])+/, "");
    const filePath = resolve(join(root, relativePath));

    if (!filePath.startsWith(`${root}/`) || !existsSync(filePath) || !statSync(filePath).isFile()) {
        response.writeHead(404, securityHeaders);
        response.end("Not found");
        return;
    }

    response.writeHead(200, {
        ...securityHeaders,
        "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
    process.stdout.write(`Friction test server listening on http://127.0.0.1:${port}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => server.close(() => process.exit(0)));
}
