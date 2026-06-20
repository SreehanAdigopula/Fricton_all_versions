const STORAGE_KEY = "friction-v1-state";

const CONFIG = {
    defaultSessionMinutes: 30,
    minimumSessionMinutes: 10,
    distractionLimit: 3,
    breakLimit: 3,
    failStreakPenaltyThreshold: 2,
    cleanStreakRewardThreshold: 3,
    cleanStreakRewardMinutes: 5,
    cleanStreakRewardSessions: 2,
    breakPenaltyMinutes: 5,
    failPenaltyMinutes: 5,
    petRewardSessionStep: 5,
    petRewardMaxAverageDistractions: 1
};

const defaultState = {
    sessionDuration: CONFIG.defaultSessionMinutes,
    failStreak: 0,
    successStreak: 0,
    currentDistractionCount: 0,
    currentBreakCount: 0,
    weeklyCompleted: 0,
    weeklyDistractionTotal: 0,
    weeklySessionCount: 0,
    petLevel: 1,
    nextPetRewardThreshold: CONFIG.petRewardSessionStep,
    cleanStreakBonusSessionsLeft: 0,
    timeLeft: CONFIG.defaultSessionMinutes * 60,
    sessionState: "idle",
    timerStartedAt: null,
    timerEndsAt: null
};

const elements = {
    startBtn: document.getElementById("startBtn"),
    resetWeekBtn: document.getElementById("resetWeekBtn"),
    completeBtn: document.getElementById("completeBtn"),
    distractedBtn: document.getElementById("distractedBtn"),
    breakBtn: document.getElementById("breakBtn"),
    failBtn: document.getElementById("failBtn"),
    sessionControls: document.getElementById("sessionControls"),
    sessionInfo: document.getElementById("sessionInfo"),
    petInfo: document.getElementById("petInfo"),
    petAvatar: document.getElementById("petAvatar"),
    weeklyHeadline: document.getElementById("weeklyHeadline"),
    weeklyCompleted: document.getElementById("weeklyCompleted"),
    weeklyDistractions: document.getElementById("weeklyDistractions"),
    breakInfo: document.getElementById("breakInfo"),
    distractionInfo: document.getElementById("distractionInfo"),
    timerDisplay: document.getElementById("timerDisplay"),
    timerNote: document.getElementById("timerNote"),
    sessionStatus: document.getElementById("sessionStatus"),
    output: document.getElementById("output"),
    storageToast: document.getElementById("storageToast")
};

let canUseStorage = detectStorageAvailability();
let state = loadState();
let timer = null;

bindEvents();
if (!canUseStorage) {
    showStorageWarning();
}
resumeRunningSessionIfNeeded();
render();

function bindEvents() {
    elements.startBtn.addEventListener("click", startSession);
    elements.completeBtn.addEventListener("click", completeSession);
    elements.distractedBtn.addEventListener("click", markDistracted);
    elements.breakBtn.addEventListener("click", takeBreak);
    elements.failBtn.addEventListener("click", failSession);
    elements.resetWeekBtn.addEventListener("click", resetWeek);
}

function loadState() {
    if (!canUseStorage) {
        return { ...defaultState };
    }

    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return { ...defaultState };
        }

        return sanitizeState(JSON.parse(saved));
    } catch (error) {
        console.warn("Unable to load saved Friction state.", error);
        return { ...defaultState };
    }
}

function sanitizeState(savedState) {
    return {
        ...defaultState,
        ...savedState,
        sessionDuration: toPositiveNumber(savedState.sessionDuration, CONFIG.defaultSessionMinutes),
        failStreak: toPositiveNumber(savedState.failStreak, 0),
        successStreak: toPositiveNumber(savedState.successStreak, 0),
        currentDistractionCount: toPositiveNumber(savedState.currentDistractionCount, 0),
        currentBreakCount: toPositiveNumber(savedState.currentBreakCount, 0),
        weeklyCompleted: toPositiveNumber(savedState.weeklyCompleted, 0),
        weeklyDistractionTotal: toPositiveNumber(savedState.weeklyDistractionTotal, 0),
        weeklySessionCount: toPositiveNumber(savedState.weeklySessionCount, 0),
        petLevel: Math.max(1, toPositiveNumber(savedState.petLevel, 1)),
        nextPetRewardThreshold: Math.max(CONFIG.petRewardSessionStep, toPositiveNumber(savedState.nextPetRewardThreshold, CONFIG.petRewardSessionStep)),
        cleanStreakBonusSessionsLeft: toPositiveNumber(savedState.cleanStreakBonusSessionsLeft, 0),
        timeLeft: toPositiveNumber(savedState.timeLeft, CONFIG.defaultSessionMinutes * 60),
        sessionState: normalizeSessionState(savedState.sessionState),
        timerStartedAt: savedState.timerStartedAt || null,
        timerEndsAt: savedState.timerEndsAt || null
    };
}

function normalizeSessionState(value) {
    const validStates = ["idle", "running", "awaiting-result"];
    return validStates.includes(value) ? value : "idle";
}

function toPositiveNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function persistState() {
    if (!canUseStorage) {
        return;
    }

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        canUseStorage = false;
        showStorageWarning();
        console.warn("Unable to save Friction state.", error);
    }
}

function startSession() {
    if (state.sessionState === "running") {
        updateOutput("A session is already running.");
        return;
    }

    state.currentDistractionCount = 0;
    state.currentBreakCount = 0;
    state.timeLeft = state.sessionDuration * 60;
    state.sessionState = "running";
    state.timerStartedAt = Date.now();
    state.timerEndsAt = state.timerStartedAt + (state.timeLeft * 1000);

    startTimer();
    updateOutput("Session started. Stay with the task until the timer ends.");
    saveAndRender();
}

function startTimer() {
    stopTimer();

    timer = window.setInterval(() => {
        if (state.sessionState !== "running" || !state.timerEndsAt) {
            stopTimer();
            return;
        }

        const secondsLeft = Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000));
        state.timeLeft = secondsLeft;

        if (secondsLeft === 0) {
            stopTimer();
            state.sessionState = "awaiting-result";
            updateOutput("Time is up. Mark the session as completed, distracted, or failed.");
            saveAndRender();
            return;
        }

        persistState();
        renderTimer();
    }, 1000);
}

function stopTimer() {
    if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
    }
}

function resumeRunningSessionIfNeeded() {
    if (state.sessionState !== "running" || !state.timerEndsAt) {
        return;
    }

    const secondsLeft = Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000));
    state.timeLeft = secondsLeft;

    if (secondsLeft === 0) {
        state.sessionState = "awaiting-result";
        state.timerStartedAt = null;
        state.timerEndsAt = null;
        updateOutput("Your previous session ended while the page was closed. Mark the result now.");
        persistState();
        return;
    }

    startTimer();
}

function completeSession() {
    if (!canResolveSession()) {
        return;
    }

    finalizeSessionBase();
    state.weeklyCompleted += 1;
    state.successStreak += 1;
    state.failStreak = 0;

    if (
        state.currentDistractionCount === 0 &&
        state.successStreak >= CONFIG.cleanStreakRewardThreshold
    ) {
        state.cleanStreakBonusSessionsLeft = CONFIG.cleanStreakRewardSessions;
        state.sessionDuration += CONFIG.cleanStreakRewardMinutes;
        updateOutput("Three clean sessions in a row. The next two sessions are 5 minutes longer.");
    } else {
        updateOutput("Session completed. Nice work.");
    }

    applyBonusCountdown();
    checkWeeklyReward();
    saveAndRender();
}

function markDistracted() {
    if (state.sessionState !== "running") {
        updateOutput("Start a session first.");
        return;
    }

    state.currentDistractionCount += 1;

    if (state.currentDistractionCount >= CONFIG.distractionLimit) {
        state.sessionDuration = CONFIG.minimumSessionMinutes;
        state.successStreak = 0;
        updateOutput("Three distractions reached. The next session is reset to 10 minutes.");
    } else {
        updateOutput(`Distraction recorded. ${state.currentDistractionCount} of ${CONFIG.distractionLimit} this session.`);
    }

    saveAndRender();
}

function takeBreak() {
    if (state.sessionState !== "running") {
        updateOutput("Start a session first.");
        return;
    }

    state.currentBreakCount += 1;

    if (state.currentBreakCount >= CONFIG.breakLimit) {
        state.sessionDuration = Math.max(
            CONFIG.minimumSessionMinutes,
            state.sessionDuration - CONFIG.breakPenaltyMinutes
        );
        state.successStreak = 0;
        updateOutput("Too many breaks. The next session is 5 minutes shorter.");
    } else {
        updateOutput(`Break recorded. ${state.currentBreakCount} of ${CONFIG.breakLimit} this session.`);
    }

    saveAndRender();
}

function failSession() {
    if (!canResolveSession()) {
        return;
    }

    finalizeSessionBase();
    state.failStreak += 1;
    state.successStreak = 0;

    if (state.failStreak >= CONFIG.failStreakPenaltyThreshold) {
        state.sessionDuration = Math.max(
            CONFIG.minimumSessionMinutes,
            state.sessionDuration - CONFIG.failPenaltyMinutes
        );
        updateOutput("Two failed sessions in a row. The next session is 5 minutes shorter.");
    } else {
        updateOutput("Session failed. Try again.");
    }

    applyBonusCountdown();
    saveAndRender();
}

function canResolveSession() {
    if (state.sessionState === "idle") {
        updateOutput("Start a session first.");
        return false;
    }

    return true;
}

function finalizeSessionBase() {
    stopTimer();
    state.weeklySessionCount += 1;
    state.weeklyDistractionTotal += state.currentDistractionCount;
    state.sessionState = "idle";
    state.timerStartedAt = null;
    state.timerEndsAt = null;
    state.timeLeft = state.sessionDuration * 60;
}

function applyBonusCountdown() {
    if (state.cleanStreakBonusSessionsLeft <= 0) {
        return;
    }

    state.cleanStreakBonusSessionsLeft -= 1;

    if (state.cleanStreakBonusSessionsLeft === 0) {
        state.sessionDuration = Math.max(
            CONFIG.minimumSessionMinutes,
            state.sessionDuration - CONFIG.cleanStreakRewardMinutes
        );
    }
}

function checkWeeklyReward() {
    const avgDistractions = getWeeklyAverage();

    if (
        state.weeklyCompleted >= state.nextPetRewardThreshold &&
        avgDistractions <= CONFIG.petRewardMaxAverageDistractions
    ) {
        state.petLevel += 1;
        state.nextPetRewardThreshold += CONFIG.petRewardSessionStep;
        updateOutput(`Great week. Your pet grew to Level ${state.petLevel}.`);
    }
}

function resetWeek() {
    stopTimer();
    state = {
        ...state,
        weeklyCompleted: 0,
        weeklyDistractionTotal: 0,
        weeklySessionCount: 0,
        failStreak: 0,
        successStreak: 0,
        nextPetRewardThreshold: CONFIG.petRewardSessionStep,
        currentDistractionCount: 0,
        currentBreakCount: 0,
        sessionState: "idle",
        timerStartedAt: null,
        timerEndsAt: null,
        timeLeft: state.sessionDuration * 60
    };
    updateOutput("Weekly stats reset.");
    saveAndRender();
}

function getWeeklyAverage() {
    if (state.weeklySessionCount === 0) {
        return 0;
    }

    return state.weeklyDistractionTotal / state.weeklySessionCount;
}

function render() {
    elements.sessionInfo.textContent = `${state.sessionDuration} minutes`;
    elements.petInfo.textContent = String(state.petLevel);
    elements.petAvatar.textContent = `Lv ${state.petLevel}`;
    elements.weeklyHeadline.textContent = `${state.weeklyCompleted} completed this week`;
    elements.weeklyCompleted.textContent = String(state.weeklyCompleted);
    elements.weeklyDistractions.textContent = getWeeklyAverage().toFixed(2);
    elements.breakInfo.textContent = String(state.currentBreakCount);
    elements.distractionInfo.textContent = String(state.currentDistractionCount);
    elements.sessionStatus.textContent = getSessionStatusLabel();
    elements.sessionControls.hidden = state.sessionState === "idle";
    elements.startBtn.disabled = state.sessionState === "running";
    elements.startBtn.textContent = state.sessionState === "running"
        ? "Session Running"
        : "Start Session";
    elements.timerNote.textContent = getTimerNote();
    renderTimer();
}

function renderTimer() {
    const displaySeconds = state.sessionState === "idle"
        ? state.sessionDuration * 60
        : state.timeLeft;

    const minutes = Math.floor(displaySeconds / 60);
    const seconds = String(displaySeconds % 60).padStart(2, "0");
    elements.timerDisplay.textContent = `${minutes}:${seconds}`;
}

function getSessionStatusLabel() {
    if (state.sessionState === "running") {
        return "Running";
    }

    if (state.sessionState === "awaiting-result") {
        return "Awaiting Result";
    }

    return "Ready";
}

function updateOutput(message) {
    elements.output.textContent = message;
}

function saveAndRender() {
    persistState();
    render();
}

function detectStorageAvailability() {
    try {
        const probeKey = "__friction_probe__";
        window.localStorage.setItem(probeKey, "1");
        window.localStorage.removeItem(probeKey);
        return true;
    } catch (error) {
        console.warn("Local storage is unavailable in this browser context.", error);
        return false;
    }
}

function showStorageWarning() {
    if (elements.storageToast) {
        elements.storageToast.hidden = false;
    }
}

function getTimerNote() {
    if (state.sessionState === "running") {
        return "The timer is live. You can still end the session early if you need to.";
    }

    if (state.sessionState === "awaiting-result") {
        return "Timer finished. Record the outcome to update streaks and weekly stats.";
    }

    return "Start a focus block and let the clock run while you work.";
}
