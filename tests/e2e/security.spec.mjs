import { expect, getState, openFocus, openFresh, seedState, test } from "./helpers.mjs";

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
            "javascript:alert(1)",
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

    test("local responses include the release security headers", async ({ request }) => {
        const response = await request.get("/friction_html.html");
        expect(response.status()).toBe(200);
        expect(response.headers()["x-content-type-options"]).toBe("nosniff");
        expect(response.headers()["x-frame-options"]).toBe("DENY");
        expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
        expect(response.headers()["content-security-policy"]).toContain("object-src 'none'");
    });
});
