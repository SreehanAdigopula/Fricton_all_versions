# Friction Final Release Testing Guide

## Purpose And Release Rule

This guide validates the public Friction Focus experience. It does not claim that software can be proven to contain zero bugs. A release receives `GO` only when there are no known core defects involving crashes, security, data loss, timer/session logic, incorrect adaptive values, persistence, or the critical workflow on a supported browser.

System Builder and Motivation are out of scope. Their only release requirement is that both entry buttons remain visibly closed and disabled and the Vercel route shows `system-builder-testing.html`.

## Evidence And Result Format

For every numbered test, record `PASS`, `FAIL`, `BLOCKED`, or `NOT RUN`; browser/device; date; tester; build SHA; evidence; and defect ID when applicable. A screenshot alone is not enough for state tests: include the visible result and saved-state assertion. Playwright automatically retains screenshots, video, and traces for failures.

Severity definitions:

- `P0`: security compromise, destructive data loss, or app cannot load. Release blocker.
- `P1`: broken Focus flow, wrong timer/counter/adaptive/pet value, persistence failure, or critical browser failure. Release blocker.
- `P2`: substantial usability, accessibility, media fallback, or responsive problem with a workaround. Record before release decision.
- `P3`: minor copy, spacing, or cosmetic issue. Record for cleanup.

### Result Ledger

Mark exactly one result for each case after following its prerequisites, steps, expected result, and evidence requirement below.

| Case | PASS | FAIL | BLOCKED | NOT RUN | Browser/device | Evidence | Defect ID |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FR-001 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-002 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-010 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-011 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-012 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-013 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-014 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-020 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-021 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-030 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-040 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-050 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-051 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-052 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-060 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-070 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-071 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-080 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-090 | [ ] | [ ] | [ ] | [ ] |  |  |  |
| FR-091 | [ ] | [ ] | [ ] | [ ] |  |  |  |

## Test Environment

1. Record `git rev-parse HEAD`, `git status --short`, Node/npm versions, operating system, browser versions, local URL, and production URL.
2. Run tests only on the isolated `127.0.0.1:4173` server or fresh browser profiles. Never clear the user’s normal Friction browser storage.
3. Install once with `npm install` and `npx playwright install chromium firefox webkit`.
4. Run `npm run test:static`, `npm run test:core`, `npm run test:security`, `npm run test:browsers`, `npm run test:live`, then `npm run test:release`.
5. Repeat the manual critical path in current Chrome, Edge, Firefox, Safari, and Comet. Test laptop, tablet, and phone sizes or physical devices where available.

## Automated Release Cases

### FR-001 Startup And Routes — P1

- Preconditions: fresh browser context with no `friction-v1-state`.
- Steps: load `/`, `/index.html`, and `/friction_html.html`; inspect assets and console; use Home, Focus, Pet, and Settings; refresh each view.
- Expected: Friction opens without login, Home is initially active, every asset loads, navigation and refresh preserve a valid view, and no uncaught error appears.
- Evidence: route status list, DOM assertions, console log, screenshot at desktop and phone widths.

### FR-002 Closed System Builder — P1

- Steps: inspect both System Builder controls and request `/system-builder.html` on production.
- Expected: both controls are disabled and crossed out; keyboard and pointer activation do nothing; production displays only the under-testing page; builder scripts return 404.

### FR-010 Timer Lifecycle — P1

- Steps: start at 30:00; observe at least one tick; try starting again; navigate between tabs; reload; seed a deadline in the past; complete and fail from running and awaiting-result states.
- Expected: one timer runs, countdown is monotonic, reload resumes from the stored deadline, expiry shows 0:00 and Awaiting Result, outcomes stop the timer, and the next session starts cleanly.

### FR-011 Session Controls And Counters — P1

- Steps: attempt every outcome while idle; start; add a distraction; take a break; wait; refresh; resume; complete; repeat with fail.
- Expected: outcome controls are disabled while idle; Break pauses the timer and supported study audio, increments once, survives refresh, and becomes Resume; Resume continues without adding another break; running counters match actions exactly; weekly and lifetime totals increment once; a mixed completion is not a clean streak; double submission is impossible.

### FR-012 Threshold Penalties — P1

- Steps: run sessions with three distractions, three breaks, and two consecutive failures.
- Expected: third distraction sets the next session to 10 minutes; three distinct pause/resume breaks subtract one 5-minute step; each failed result changes duration by no more than one adaptive step; duration never leaves 10–60 minutes.

### FR-013 Clean Streak Bonus — P1

- Steps: complete three clean sessions, then two more sessions.
- Expected: the third clean completion grants exactly +5 minutes; `cleanStreakBonusSessionsLeft` starts at 2, becomes 1, then 0; the bonus duration returns to baseline after those two sessions; displayed and saved recommendations match.

### FR-014 Adaptive Coach — P1

- Test Learning Mode, Recovery Mode, Distraction Reset, Energy Saver, Deep Work Stretch, Steady Builder, and Gentle Restart using boundary-state fixtures.
- Expected: the selected mode, reason, tip, recommended minutes, timer duration, and persisted value agree; only the latest 12 adaptive events are retained.

### FR-020 Persistence And Corruption — P1

- Steps: save every main-app value; reload; seed missing, old, invalid, oversized, negative, and hostile state values.
- Expected: valid values survive exactly; invalid fields fall back or clamp; the app never crashes; hostile strings never become executable markup.

### FR-021 Local Data Reset — P0

- Steps: create progress and an unrelated local-storage key; open reset; cancel; try `clear`, spaces, and `CLEAR`; confirm.
- Expected: cancel preserves everything; only exact `CLEAR` enables deletion; only `friction-v1-state` is removed; unrelated origin data remains; clean defaults load.

### FR-030 Pet Progress And Stress — P1

- Steps: render all ten pets at levels 1, 2, and 3; reach five clean weekly completions; seed eight/nine distractions and three/four failures; complete clean recovery sessions; reset week.
- Expected: every form renders; milestone growth happens once; sad/small form begins exactly at 9 distractions or 4 failures; each clean session recovers 3 distraction stress and 1 failure stress; reset clears weekly stress.

### FR-040 Thought Parking — P1

- Steps: submit empty, spaced, duplicate, 160-character, overlong, and hostile strings; add six unique items; reload; dismiss; clear.
- Expected: empty input is ignored; text is trimmed and bounded; only five newest unique items remain; values persist; dismiss/clear are exact; no HTML executes.

### FR-050 Built-In Media — P1

- Steps: select all seven Nature, three Noise, and two Handpan items; inspect title, provider type, iframe URL, referrer policy, Play/Pause, volume, reload, and failure fallback.
- Expected: all 12 map to the intended source; no Error 153; one source is active; controls never crash; failed embeds show a usable fallback without breaking the timer.

### FR-051 Custom Playlist Validation — P0

- Accept: YouTube `/playlist?list=PL…` and Spotify `/playlist/{id}`.
- Reject: YouTube watch/short/embed URLs, `RD` auto-mixes, Spotify tracks/albums/shows/episodes, HTTP lookalike domains, unsupported sites, malformed URLs, `javascript:`, `data:`, HTML, SVG, and event-handler payloads.
- Expected: accepted URLs become canonical trusted embeds; rejected input shows an inline error and never replaces a saved valid playlist or creates markup.

### FR-052 Live Provider Smoke — P2

- Steps: load one built-in YouTube source and Spotify Peaceful Piano without mocks; inspect the actual iframe and provider response; manually press provider Play when permitted.
- Expected: provider UI loads without configuration error. Sign-in, ads, preview-only playback, and autoplay blocking are provider limitations and must be distinguished from malformed app configuration.

### FR-060 Settings And Appearance — P2

- Steps: exercise eight themes, five shapes, every tint control path, hints, motion, and ten pet choices; reload after each category.
- Expected: selection persists, text remains readable, motion is off on a fresh profile, the lag warning is present, and the dot field stays behind interactive UI.

### FR-070 Responsive And Touch — P1

- Viewports: 320, 390, 768, 1024, and 1440 pixels wide at browser zoom 100%; repeat phone tests at 200% text zoom.
- Expected: no horizontal page overflow, overlap, clipping, lost controls, layout shift after dynamic text, or unusable touch targets; timer, counters, media, dialog, and playlist feedback remain visible.

### FR-071 Keyboard And Accessibility — P2

- Steps: complete the Focus flow using keyboard only; inspect focus order, labels, live messages, disabled controls, dialog naming/focus, heading structure, contrast, and reduced-motion behavior.
- Expected: no keyboard trap; focus is visible; fields have usable names; status changes are announced; critical controls meet 44px touch sizing; core text remains readable in every theme.

### FR-080 Offline And Denied Capabilities — P1

- Test time API failure, offline reload after assets are cached, blocked local storage, denied notifications, unavailable AudioContext, autoplay denial, YouTube error, and Spotify preview behavior.
- Expected: local clock fallback works; Focus remains usable; temporary-storage warning is accurate; failures are contained and explained without blank screens or uncaught errors.

### FR-090 Security And Deployment — P0

- Verify HTTPS; CSP; `nosniff`; frame denial; strict referrer policy; permissions policy; safe external-window settings; allowed frame domains; missing/private paths returning 404; and no secrets in source, responses, storage, logs, or test artifacts.
- Expected: only required resources are allowed; Friction cannot be framed; dangerous schemes and arbitrary domains are blocked; production serves the tested cache-busted files.

### FR-091 Content Consistency — P2

- Compare visible UI, README, App Rules, Policies, storage behavior, media validation, thresholds, and closed-feature status.
- Expected: documentation does not promise accounts, sync, regular custom videos, public System Builder access, or behavior the code does not implement.

## Manual Browser Matrix

For Chrome, Edge, Firefox, Safari/WebKit, and Comet, record version and repeat: fresh load; navigate to Focus; play one built-in source; start a session; add one distraction and break; complete; reload and confirm values; park/dismiss a thought; change theme; inspect Pet; cancel reset. On one laptop, tablet, and phone layout, also check scrolling, touch, orientation, virtual-keyboard interaction, and media resizing.

## Final Report Template

The final `TEST_REPORT.md` must contain: date/time; tester; OS; source SHA and dirty files; local and production URLs; dependency/browser versions; command results; pass/fail/skip totals; per-browser matrix; confirmed fixes; open P0–P3 defects; provider limitations; screenshots/traces; security header results; and a clear `GO` or `NO-GO` decision. Any P0/P1 failure or unexplained skipped core test forces `NO-GO`.
