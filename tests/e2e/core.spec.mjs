import { expect, getState, openFocus, openFresh, seedState, test } from "./helpers.mjs";

test.describe("Friction core focus workflow", () => {
    test("fresh startup and primary navigation", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page);

        await expect(page).toHaveTitle("Friction: Adaptor");
        await expect(page.getByRole("heading", { name: "Friction" })).toBeVisible();
        await expect(page.locator("#tabHome")).toHaveClass(/is-active/);
        await expect(page.locator("#tabMotivation")).toBeDisabled();

        await openFocus(page);
        await expect(page.locator("#timerDisplay")).toHaveText("30:00");
        await page.getByRole("button", { name: "Pet", exact: true }).click();
        await expect(page.locator("#panel-pet")).toBeVisible();
        await page.getByRole("button", { name: "Settings", exact: true }).click();
        await expect(page.locator("#panel-settings")).toBeVisible();
        await page.reload();
        await expect(page.locator("#panel-settings")).toBeVisible();
    });

    test("timer starts, counts down, survives reload, and expires", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page);
        await openFocus(page);

        await page.locator("#startBtn").click();
        await expect(page.locator("#startBtn")).toBeDisabled();
        await expect(page.locator("#sessionStatus")).toHaveText("Running");
        await page.waitForTimeout(1_150);
        const running = await getState(page);
        expect(running.timeLeft).toBeLessThan(1_800);
        expect(running.sessionState).toBe("running");

        await page.reload();
        await expect(page.locator("#sessionStatus")).toHaveText("Running");

        const expired = {
            ...await getState(page),
            activeTab: "focus",
            sessionState: "running",
            timerStartedAt: Date.now() - 31 * 60_000,
            timerEndsAt: Date.now() - 1_000,
            timeLeft: 1
        };
        await seedState(page, expired);
        await expect(page.locator("#sessionStatus")).toHaveText("Awaiting Result");
        await expect(page.locator("#timerDisplay")).toHaveText("0:00");
        await expect(page.locator("#completeBtn")).toBeEnabled();
    });

    test("session controls reject idle actions and record a mixed completion", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page);
        await openFocus(page);

        for (const id of ["#completeBtn", "#distractedBtn", "#breakBtn", "#failBtn"]) {
            await expect(page.locator(id)).toBeDisabled();
        }

        await page.locator("#startBtn").click();
        await page.locator("#distractedBtn").click();
        await page.locator("#breakBtn").click();
        await page.locator("#completeBtn").click();

        const state = await getState(page);
        expect(state.sessionState).toBe("idle");
        expect(state.weeklyCompleted).toBe(1);
        expect(state.totalCompletedSessions).toBe(1);
        expect(state.totalDistractionCount).toBe(1);
        expect(state.totalBreakCount).toBe(1);
        expect(state.successStreak).toBe(0);
        await expect(page.locator("#weeklyDistractions")).toHaveText("1.00");
    });

    test("distraction and break thresholds apply one bounded penalty", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page);
        await openFocus(page);
        await page.locator("#startBtn").click();
        for (let index = 0; index < 3; index += 1) await page.locator("#distractedBtn").click();
        let state = await getState(page);
        expect(state.sessionDuration).toBe(10);
        await page.locator("#completeBtn").click();
        state = await getState(page);
        expect(state.sessionDuration).toBe(10);

        await openFresh(page);
        await openFocus(page);
        await page.locator("#startBtn").click();
        for (let index = 0; index < 3; index += 1) await page.locator("#breakBtn").click();
        state = await getState(page);
        expect(state.sessionDuration).toBe(25);
        await page.locator("#completeBtn").click();
        state = await getState(page);
        expect(state.sessionDuration).toBe(25);
    });

    test("failures never reduce a session by more than one step per result", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page);
        await openFocus(page);

        await page.locator("#startBtn").click();
        await page.locator("#failBtn").click();
        let state = await getState(page);
        expect(state.sessionDuration).toBe(30);
        expect(state.failStreak).toBe(1);

        await page.locator("#startBtn").click();
        await page.locator("#failBtn").click();
        state = await getState(page);
        expect(state.sessionDuration).toBe(25);
        expect(state.failStreak).toBe(2);
        expect(state.totalFailedSessions).toBe(2);
    });

    test("clean streak bonus lasts exactly two following sessions", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page);
        await openFocus(page);

        for (let index = 0; index < 3; index += 1) {
            await page.locator("#startBtn").click();
            await page.locator("#completeBtn").click();
        }
        let state = await getState(page);
        expect(state.sessionDuration).toBe(35);
        expect(state.cleanStreakBonusSessionsLeft).toBe(2);
        expect(state.adaptiveProfile.recommendedMinutes).toBe(35);

        await page.locator("#startBtn").click();
        await page.locator("#completeBtn").click();
        state = await getState(page);
        expect(state.sessionDuration).toBe(35);
        expect(state.cleanStreakBonusSessionsLeft).toBe(1);

        await page.locator("#startBtn").click();
        await page.locator("#completeBtn").click();
        state = await getState(page);
        expect(state.sessionDuration).toBe(30);
        expect(state.cleanStreakBonusSessionsLeft).toBe(0);
        expect(state.adaptiveProfile.recommendedMinutes).toBe(30);
    });

    test("pet grows, becomes sad at both thresholds, and recovers", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page, {
            weeklyCompleted: 4,
            weeklySessionCount: 4,
            weeklyDistractionTotal: 0,
            totalCompletedSessions: 4,
            nextPetRewardThreshold: 5,
            petLevel: 1,
            activeTab: "focus"
        });
        await page.locator("#startBtn").click();
        await page.locator("#completeBtn").click();
        let state = await getState(page);
        expect(state.petLevel).toBe(2);
        expect(state.nextPetRewardThreshold).toBe(10);

        await seedState(page, { ...state, activeTab: "pet", petStressDistractions: 9, petStressFailures: 0 });
        await expect(page.locator("#petLevelDisplay")).toContainText("Small sad");
        await seedState(page, { ...await getState(page), activeTab: "pet", petStressDistractions: 0, petStressFailures: 4 });
        await expect(page.locator("#petLevelDisplay")).toContainText("Small sad");

        await seedState(page, { ...await getState(page), activeTab: "focus", petStressDistractions: 9, petStressFailures: 4 });
        await page.locator("#startBtn").click();
        await page.locator("#completeBtn").click();
        state = await getState(page);
        expect(state.petStressDistractions).toBe(6);
        expect(state.petStressFailures).toBe(3);
    });

    test("all pets render in normal and sad forms", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page);
        await page.getByRole("button", { name: "Settings", exact: true }).click();
        const pets = ["dragon", "dog", "cat", "chicken", "phoenix", "owl", "fox", "wolf", "bunny", "turtle"];

        for (const pet of pets) {
            await page.locator("#petAppearanceSelect").selectOption(pet);
            await page.getByRole("button", { name: "Pet", exact: true }).click();
            await expect(page.locator(".pet-sketch svg")).toBeVisible();
            const state = await getState(page);
            await seedState(page, { ...state, activeTab: "pet", petStressDistractions: 9 });
            await expect(page.locator(".pet-portrait")).toHaveAttribute("data-mood", "sad");
            await page.getByRole("button", { name: "Settings", exact: true }).click();
        }
    });

    test("parking lot caps, deduplicates, persists, dismisses, and clears", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page);
        await openFocus(page);
        const input = page.locator("#parkingLotInput");

        await input.fill("   ");
        await page.locator("#parkThoughtBtn").click();
        expect((await getState(page)).parkingLot).toEqual([]);

        for (const thought of ["one", "two", "three", "four", "five", "six"]) {
            await input.fill(thought);
            await page.locator("#parkThoughtBtn").click();
        }
        let state = await getState(page);
        expect(state.parkingLot).toEqual(["six", "five", "four", "three", "two"]);
        await input.fill("four");
        await page.locator("#parkThoughtBtn").click();
        state = await getState(page);
        expect(state.parkingLot).toEqual(["four", "six", "five", "three", "two"]);

        await page.reload();
        await page.locator("button[data-parking-index='0']").click();
        expect((await getState(page)).parkingLot).toEqual(["six", "five", "three", "two"]);
        await page.locator("#clearParkingLotBtn").click();
        expect((await getState(page)).parkingLot).toEqual([]);
    });

    test("settings persist and local reset requires exact CLEAR", async ({ appPage }) => {
        const { page } = appPage;
        await openFresh(page);
        await page.getByRole("button", { name: "Settings", exact: true }).click();
        await page.locator("#themeSelect").selectOption("forest");
        await page.locator("#shapeSelect").selectOption("orbit");
        await page.locator("#motionBackgroundToggle").check();
        await page.locator("#hintsToggle").uncheck();
        await page.locator("#petAppearanceSelect").selectOption("owl");
        await page.reload();
        let state = await getState(page);
        expect(state.settings).toMatchObject({ theme: "forest", backgroundShape: "orbit", motionBackground: true, showHints: false, petAppearance: "owl" });

        await page.evaluate(() => localStorage.setItem("unrelated-test-key", "keep"));
        await page.locator("#signOutBtn").click();
        await page.locator("#resetDataInput").fill("clear");
        await expect(page.locator("#confirmResetDataBtn")).toBeDisabled();
        await page.locator("#resetDataInput").fill("CLEAR");
        await expect(page.locator("#confirmResetDataBtn")).toBeEnabled();
        await Promise.all([
            page.waitForNavigation(),
            page.locator("#confirmResetDataBtn").click()
        ]);
        state = await getState(page);
        expect(state).toBeNull();
        await expect(page.locator("#themeSelect")).toHaveValue("classic");
        await expect(page.locator("body")).not.toHaveClass(/theme-forest/);
        await expect(page.locator("#timerDisplay")).toHaveText("30:00");
        expect(await page.evaluate(() => localStorage.getItem("unrelated-test-key"))).toBe("keep");
    });
});
