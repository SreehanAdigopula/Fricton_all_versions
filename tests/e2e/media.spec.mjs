import { expect, openFocus, openFresh, test } from "./helpers.mjs";

const collections = [
    {
        select: "#natureTrackList",
        tracks: [
            ["nature-1", "nE_XAauwu1I", "Rain River Waterfall"],
            ["nature-2", "aJaZc4E8Y4U", "Bamboo Water Fountain"],
            ["nature-3", "Qo3OM5sPUPM", "Large Waterfall"],
            ["nature-4", "mPZkdNFkNps", "Rain On Window"],
            ["nature-5", "akpLkQd8WnE", "Windy Weather"],
            ["nature-6", "WmdmTPMOVlM", "Frogs At Night"],
            ["nature-7", "cwOsAwwudTc", "Tawny Owls At Night"]
        ]
    },
    {
        select: "#noiseTrackList",
        tracks: [
            ["noise-1", "nMfPqeZjc2c", "White Noise"],
            ["noise-2", "0GDfOAuUvQ0", "Brown Noise"],
            ["noise-3", "bIjlfqPDTjY", "Pink Noise"]
        ]
    },
    {
        select: "#handpanTrackList",
        tracks: [
            ["handpan-1", "UmeLehbflo0", "Golden Light of Peace"],
            ["handpan-2", "uwEaQk5VeS4", "Calming Meditation"]
        ]
    }
];

test("all 12 built-in sources map to the intended YouTube embed", async ({ appPage }) => {
    const { page } = appPage;
    await openFresh(page);
    await openFocus(page);

    for (const collection of collections) {
        for (const [value, videoId, title] of collection.tracks) {
            await page.locator(collection.select).selectOption(value);
            await expect(page.locator("#focusMediaTitle")).toHaveText(title);
            await expect(page.locator("#focusMediaFrame")).toHaveAttribute("src", new RegExp(`/embed/${videoId}(?:\\?|$)`));
            await expect(page.locator("#focusMediaFrame")).toHaveAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        }
    }
});

test("media controls remain usable while a focus timer runs", async ({ appPage }) => {
    const { page } = appPage;
    await openFresh(page);
    await openFocus(page);
    await page.locator("#startBtn").click();
    await page.locator("#environmentVolume").fill("35");
    await page.locator("#environmentPlayBtn").click();
    await page.locator("#showMediaBtn").click();
    await expect(page.locator("#sessionStatus")).toHaveText("Running");
    await expect(page.locator("#environmentVolumeValue")).toHaveText("35%");
    await page.locator("#environmentPauseBtn").click();
    await expect(page.locator("#focusMediaFrame")).toBeVisible();
});
