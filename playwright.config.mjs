import { defineConfig, devices } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const cometExecutable = "/Applications/Comet.app/Contents/MacOS/Comet";
const smokeOnly = /browser-smoke\.spec\.mjs/;
const sourceRevision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const sourceStatus = execFileSync("git", ["status", "--short"], { encoding: "utf8" }).trim();

const projects = [
    {
        name: "chromium",
        use: { ...devices["Desktop Chrome"] }
    },
    {
        name: "firefox",
        testMatch: smokeOnly,
        use: { ...devices["Desktop Firefox"] }
    },
    {
        name: "webkit",
        testMatch: smokeOnly,
        use: { ...devices["Desktop Safari"] }
    },
    {
        name: "chrome",
        testMatch: smokeOnly,
        use: { ...devices["Desktop Chrome"], channel: "chrome" }
    },
    {
        name: "edge",
        testMatch: smokeOnly,
        use: { ...devices["Desktop Edge"], channel: "msedge" }
    },
    {
        name: "mobile-chrome",
        testMatch: smokeOnly,
        use: { ...devices["Pixel 7"] }
    },
    {
        name: "mobile-webkit",
        testMatch: smokeOnly,
        use: { ...devices["iPhone 14"] }
    },
    {
        name: "tablet",
        testMatch: smokeOnly,
        use: { ...devices["iPad (gen 7)"] }
    }
];

for (const width of [320, 390, 768, 1024, 1440]) {
    projects.push({
        name: `viewport-${width}`,
        testMatch: smokeOnly,
        use: {
            ...devices["Desktop Chrome"],
            viewport: { width, height: width <= 390 ? 844 : 900 }
        }
    });
}

if (process.env.RUN_COMET === "1" && existsSync(cometExecutable)) {
    projects.push({
        name: "comet",
        testMatch: smokeOnly,
        use: {
            ...devices["Desktop Chrome"],
            browserName: "chromium",
            launchOptions: { executablePath: cometExecutable }
        }
    });
}

export default defineConfig({
    metadata: { sourceRevision, sourceStatus },
    testDir: "./tests/e2e",
    fullyParallel: false,
    forbidOnly: true,
    retries: 0,
    workers: 1,
    timeout: 30_000,
    expect: { timeout: 7_500 },
    outputDir: "test-results/artifacts",
    reporter: [
        ["line"],
        ["json", { outputFile: "test-results/results.json" }],
        ["html", { outputFolder: "playwright-report", open: "never" }]
    ],
    use: {
        baseURL: "http://127.0.0.1:4173",
        trace: "on",
        screenshot: "on",
        video: "retain-on-failure"
    },
    webServer: {
        command: "node tests/server.mjs",
        url: "http://127.0.0.1:4173/friction_html.html",
        reuseExistingServer: false,
        timeout: 15_000
    },
    projects
});
