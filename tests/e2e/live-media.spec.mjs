import { expect, test } from "@playwright/test";

test.describe("live provider smoke", () => {
    test("YouTube built-in player and Spotify public playlist produce live embeds", async ({ page }) => {
        await page.goto("/friction_html.html");
        await page.getByRole("button", { name: "Focus", exact: true }).click();
        const frame = page.locator("#focusMediaFrame");
        await expect(frame).toHaveAttribute("src", /youtube\.com\/embed\/nE_XAauwu1I/);
        await expect(frame).toHaveAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        const youtubeFrame = await (await frame.elementHandle()).contentFrame();
        await expect.poll(() => youtubeFrame.title(), { timeout: 15_000 }).toContain("YouTube");
        const youtubeText = await youtubeFrame.locator("body").innerText();
        expect(youtubeText).not.toContain("Error 153");
        expect(youtubeText).not.toContain("Video player configuration error");

        const input = page.locator("#customMediaInput");
        await input.fill("https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO");
        await page.locator("#saveCustomLinkBtn").click();
        await expect(page.locator("#customMediaFeedback")).toHaveAttribute("data-tone", "success");
        await expect(frame).toHaveAttribute("src", /open\.spotify\.com\/embed\/playlist\/37i9dQZF1DX4sWSpwq3LiO/);
        const spotifyFrame = await (await frame.elementHandle()).contentFrame();
        await expect.poll(() => spotifyFrame.title(), { timeout: 15_000 }).toContain("Peaceful Piano");
        await expect(spotifyFrame.locator("body")).toContainText("Peaceful Piano");
    });
});
