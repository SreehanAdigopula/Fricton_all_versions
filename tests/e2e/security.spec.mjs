import { expect, getState, openFocus, openFresh, seedState, test } from "./helpers.mjs";
import { request as httpRequest } from "node:http";

function rawStatus(path, host = "127.0.0.1:4173") {
    return new Promise((resolve, reject) => {
        const request = httpRequest({
            hostname: "127.0.0.1",
            port: 4173,
            path,
            method: "GET",
            headers: { Host: host }
        }, (response) => {
            response.resume();
            response.on("end", () => resolve(response.statusCode));
        });
        request.on("error", reject);
        request.end();
    });
}

test.describe("Friction input and storage security", () => {
    test("custom media accepts playlists and rejects unsafe or unsupported links", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page);
        await openFocus(page);
        const input = page.locator("#customMediaInput");
        const save = page.locator("#saveCustomLinkBtn");

        const accepted = [
            "https://www.youtube.com/playlist?list=PL1234567890abcdef",
            "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO"
        ];
        for (const url of accepted) {
            await input.fill(url);
            await save.click();
            await expect(page.locator("#customMediaFeedback")).toHaveAttribute("data-tone", "success");
        }
        const saved = (await getState(page)).focusEnvironment.customLink;

        const rejected = [
            "https://www.youtube.com/watch?v=nE_XAauwu1I",
            "https://www.youtube.com/playlist?list=RDnE_XAauwu1I",
            "https://open.spotify.com/track/1234567890abcdef123456",
            "https://example.com/video",
            "https://www.youtube.com.evil.example/playlist?list=PL1234567890abcdef",
            "https://open.spotify.com.evil.example/playlist/37i9dQZF1DX4sWSpwq3LiO",
            "javascript:alert(1)",
            "http://www.youtube.com/playlist?list=PL1234567890abcdef",
            "ftp://www.youtube.com/playlist?list=PL1234567890abcdef",
            "https://someone@www.youtube.com/playlist?list=PL1234567890abcdef",
            "http://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO",
            "data:text/html,<script>alert(1)</script>",
            "<img src=x onerror=alert(1)>"
        ];
        for (const url of rejected) {
            await input.fill(url);
            await save.click();
            await expect(page.locator("#customMediaFeedback")).toHaveAttribute("data-tone", "error");
            expect((await getState(page)).focusEnvironment.customLink).toBe(saved);
        }
        await expect(page.locator(".custom-link-box img")).toHaveCount(0);
        await expect(page.locator(".custom-link-box script")).toHaveCount(0);
    });

    test("parking text is rendered as text, never executable markup", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page);
        await openFocus(page);
        const payload = "<img src=x onerror=alert(1)><script>alert(2)</script>";
        await page.locator("#parkingLotInput").fill(payload);
        await page.locator("#parkThoughtBtn").click();
        await expect(page.locator("#parkingLotList")).toContainText(payload);
        await expect(page.locator("#parkingLotList img")).toHaveCount(0);
        await expect(page.locator("#parkingLotList script")).toHaveCount(0);
    });

    test("corrupted saved state is bounded and sanitized", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page);
        await seedState(page, {
            activeTab: "<script>alert(1)</script>",
            sessionDuration: 999_999,
            settings: { theme: "javascript:alert(1)", paperTint: "url(javascript:alert(1))", petAppearance: "bad" },
            focusEnvironment: { selected: "custom", customLink: "javascript:alert(1)", volume: 9_999 },
            parkingLot: ["<svg onload=alert(1)>", 7, null, "safe"],
            adaptiveProfile: { recommendedMinutes: 9_999, recentEvents: new Array(30).fill({ type: "failed" }) }
        });

        const state = await getState(page);
        expect(state.activeTab).toBe("home");
        expect(state.settings.theme).toBe("classic");
        expect(state.settings.paperTint).toBe("#fdfbf7");
        expect(state.settings.petAppearance).toBe("dragon");
        expect(state.focusEnvironment.customLink).toBe("");
        expect(state.focusEnvironment.volume).toBe(100);
        expect(state.adaptiveProfile.recommendedMinutes).toBe(60);
        expect(state.adaptiveProfile.recentEvents).toHaveLength(12);
        await expect(page.locator("script")).toHaveCount(1);
        await expect(page.locator("svg[onload]")).toHaveCount(0);
    });

    test("restored task, motivation, and adaptive text never become markup", async ({ appPage }) => {
        const { page } = appPage;
        const payload = "<img src=x onerror=alert(1)>";
        await openFresh(page, {
            systemTask: payload,
            motivation: { goal: payload, lastSpeech: payload, lastSearchUrl: "javascript:alert(1)" },
            adaptiveProfile: { focusStyle: payload, lastReason: payload, lastTip: payload }
        });
        await expect(page.locator("#adaptiveHomeSummary")).toContainText(payload);
        await expect(page.locator("#adaptiveHomeDetail")).toContainText(payload);
        await expect(page.locator("#appShell img[onerror]")).toHaveCount(0);
        await expect(page.locator("#appShell script")).toHaveCount(0);
        expect((await getState(page)).motivation.goal).toBe(payload);
    });

    test("YouTube embeds do not receive page query parameters or fragments", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page, null, "/friction_html.html?private=fictional-query#fictional-fragment");
        const embedUrl = new URL(await page.locator("#focusMediaFrame").getAttribute("src"));
        expect(embedUrl.searchParams.get("widget_referrer")).toBe("http://127.0.0.1:4173/friction_html.html");
        expect(embedUrl.href).not.toContain("fictional-query");
        expect(embedUrl.href).not.toContain("fictional-fragment");
    });

    test("local responses include the release security headers", async ({ request }) => {
        const response = await request.get("/friction_html.html");
        expect(response.status()).toBe(200);
        expect(response.headers()["x-content-type-options"]).toBe("nosniff");
        expect(response.headers()["x-frame-options"]).toBe("DENY");
        expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
        expect(response.headers()["content-security-policy"]).toContain("object-src 'none'");
    });

    test("local preview serves public assets but rejects private files and malformed paths", async ({ request }) => {
        for (const path of ["/", "/index.html", "/friction_html.html", "/frictionJS.js", "/fictioncss.css", "/favicon.svg"]) {
            expect(await rawStatus(path), path).toBe(200);
        }

        const builder = await request.get("/system-builder.html");
        expect(builder.status()).toBe(200);
        expect(await builder.text()).toContain("The main focus app is open");

        for (const path of [
            "/.private-assets/supabaseConfig.js",
            "/%2Eprivate-assets/supabaseConfig.js",
            "/.vercel/.env.production.local",
            "/%2Evercel/.env.production.local",
            "/.git/config",
            "/package.json",
            "/system-builder.js",
            "/%2E%2E/.vercel/.env.production.local"
        ]) {
            expect(await rawStatus(path), path).toBe(404);
        }

        expect(await rawStatus("/frictionJS.js", "example.test:4173")).toBe(403);
        expect(await rawStatus("/%ZZ")).toBe(400);
        expect(await rawStatus("/friction_html.html")).toBe(200);
    });
});
