import { expect, test as base } from "@playwright/test";

export const STORAGE_KEY = "friction-v1-state";

export const test = base.extend({
    appPage: async ({ page }, use, testInfo) => {
        const errors = [];
        const consoleMessages = [];
        const failedRequests = [];
        page.on("pageerror", (error) => {
            errors.push(`pageerror: ${error.message}`);
            consoleMessages.push(`pageerror: ${error.message}`);
        });
        page.on("console", (message) => {
            consoleMessages.push(`${message.type()}: ${message.text()}`);
            if (message.type() === "error") errors.push(`console: ${message.text()}`);
        });
        page.on("requestfailed", (request) => {
            failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText || "unknown"}`);
        });
        await mockExternalServices(page);
        await use({ page, errors, consoleMessages, failedRequests });
        await testInfo.attach("browser-diagnostics.json", {
            body: JSON.stringify({ consoleMessages, failedRequests }, null, 2),
            contentType: "application/json"
        });
        expect(errors, "Unexpected browser errors").toEqual([]);
    }
});

export { expect };

export async function mockExternalServices(page) {
    await page.route("https://worldtimeapi.org/**", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ unixtime: 1_788_966_000 })
        });
    });
    await page.route(/https:\/\/(?:www\.)?youtube\.com\/embed\/.*/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: "<!doctype html><title>Mock YouTube Player</title><button aria-label='Play video'>Play video</button>"
        });
    });
    await page.route(/https:\/\/open\.spotify\.com\/embed\/.*/, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "text/html",
            body: "<!doctype html><title>Mock Spotify Player</title><button aria-label='Play'>Play</button>"
        });
    });
}

export async function openFresh(page, seed = null, path = "/friction_html.html") {
    await page.goto(path);
    await page.evaluate(({ key, value }) => {
        localStorage.removeItem(key);
        if (value) localStorage.setItem(key, JSON.stringify(value));
    }, { key: STORAGE_KEY, value: seed });
    await page.reload();
    await expect(page.locator("#appShell")).toBeVisible();
}

export async function getState(page) {
    return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
}

export async function openFocus(page) {
    await page.getByRole("button", { name: "Focus", exact: true }).click();
    await expect(page.locator("#panel-focus")).toBeVisible();
}

export async function seedState(page, seed) {
    await page.evaluate(({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
    }, { key: STORAGE_KEY, value: seed });
    await page.reload();
}
