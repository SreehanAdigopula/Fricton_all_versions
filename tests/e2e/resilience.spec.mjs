import { test as base, expect } from "@playwright/test";
import { openFresh, test } from "./helpers.mjs";

base("time service failure falls back to the device clock", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.route("https://worldtimeapi.org/**", (route) => route.abort("failed"));
    await page.goto("/friction_html.html");
    await expect(page.locator("#appShell")).toBeVisible();
    await expect(page.locator("#currentDateTime")).not.toHaveText("");
    expect(pageErrors).toEqual([]);
});

base("blocked local storage keeps Focus usable in a temporary tab", async ({ page }) => {
    await page.addInitScript(() => {
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            get() {
                throw new DOMException("Storage blocked", "SecurityError");
            }
        });
    });
    await page.route("https://worldtimeapi.org/**", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ unixtime: 1_788_966_000 }) });
    });
    await page.goto("/friction_html.html");
    await expect(page.locator("#appShell")).toBeVisible();
    await expect(page.locator("#authUserLabel")).toHaveText("Temporary Tab");
    await page.getByRole("button", { name: "Focus", exact: true }).click();
    await page.locator("#startBtn").click();
    await expect(page.locator("#sessionStatus")).toHaveText("Running");
});

test("all theme and shape options apply without losing readable controls", async ({ appPage }) => {
    const { page } = appPage;
    await openFresh(page);
    await page.getByRole("button", { name: "Settings", exact: true }).click();

    for (const theme of ["classic", "blueprint", "sunset", "forest", "midnight", "citrus", "white", "black"]) {
        await page.locator("#themeSelect").selectOption(theme);
        await expect(page.locator("#themeSelect")).toHaveValue(theme);
        await expect(page.locator("#signOutBtn")).toBeVisible();
    }
    for (const shape of ["doodles", "orbit", "confetti", "calm", "minimal"]) {
        await page.locator("#shapeSelect").selectOption(shape);
        await expect(page.locator("body")).toHaveClass(new RegExp(`shapes-${shape}`));
    }
    await expect(page.locator("#motionBackgroundToggle")).not.toBeChecked();
    await expect(page.locator(".motion-performance-warning")).toBeVisible();
});

test("reset dialog is keyboard reachable, named, focused, and cancelable", async ({ appPage }) => {
    const { page } = appPage;
    await openFresh(page);
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.locator("#signOutBtn").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#resetDataDialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Delete all local Friction data?" })).toBeVisible();
    await expect(page.locator("#resetDataInput")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("#resetDataDialog")).toBeHidden();
});
