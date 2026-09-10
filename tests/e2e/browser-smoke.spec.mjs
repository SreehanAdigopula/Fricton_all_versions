import { expect, openFocus, openFresh, test } from "./helpers.mjs";

test("critical Focus path renders without overflow or browser errors", async ({ appPage }) => {
    const { page } = appPage;
    await openFresh(page);
    await expect(page.locator("#tabMotivation")).toBeDisabled();
    await openFocus(page);
    await expect(page.locator("#timerDisplay")).toHaveText("30:00");
    await expect(page.locator("#focusMediaFrame")).toBeVisible();
    await page.locator("#startBtn").click();
    await page.locator("#distractedBtn").click();
    await expect(page.locator("#focusDistractionCounter")).toHaveText("1 / 3");
    await page.locator("#completeBtn").click();
    await expect(page.locator("#sessionStatus")).toHaveText("Ready");

    const layout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        body: document.body.scrollWidth,
        app: document.getElementById("appShell").scrollWidth
    }));
    expect(layout.body).toBeLessThanOrEqual(layout.viewport + 1);
    expect(layout.app).toBeLessThanOrEqual(layout.viewport + 1);
});
