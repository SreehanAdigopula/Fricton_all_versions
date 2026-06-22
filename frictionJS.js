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
    petRewardSessionStep: 5,
    petRewardMaxAverageDistractions: 1,
    environmentOptions: ["nature", "noise", "handpan", "custom"],
    builtInEnvironmentTracks: {
        nature: [
            { id: "nature-1", label: "Rain River Waterfall", url: "https://youtu.be/nE_XAauwu1I" },
            { id: "nature-2", label: "Bamboo Water Fountain", url: "https://youtu.be/aJaZc4E8Y4U" },
            { id: "nature-3", label: "Large Waterfall", url: "https://youtu.be/Qo3OM5sPUPM" },
            { id: "nature-4", label: "Rain On Window", url: "https://youtu.be/mPZkdNFkNps" },
            { id: "nature-5", label: "Windy Weather", url: "https://youtu.be/akpLkQd8WnE" },
            { id: "nature-6", label: "Frogs At Night", url: "https://youtu.be/WmdmTPMOVlM" },
            { id: "nature-7", label: "Tawny Owls At Night", url: "https://youtu.be/cwOsAwwudTc" }
        ],
        noise: [
            { id: "noise-1", label: "White Noise", url: "https://youtu.be/nMfPqeZjc2c" },
            { id: "noise-2", label: "Brown Noise", url: "https://youtu.be/0GDfOAuUvQ0" },
            { id: "noise-3", label: "Pink Noise", url: "https://youtu.be/bIjlfqPDTjY" }
        ],
        handpan: [
            { id: "handpan-1", label: "Golden Light of Peace", url: "https://youtu.be/UmeLehbflo0?list=RDUmeLehbflo0" },
            { id: "handpan-2", label: "Calming Meditation", url: "https://youtu.be/uwEaQk5VeS4?list=RDuwEaQk5VeS4" }
        ]
    },
    petAppearances: {
        dragon: { emoji: "Dragon", summary: "A fiery mythical study guardian." },
        dog: { emoji: "Dog", summary: "Loyal and steady during long work blocks." },
        cat: { emoji: "Cat", summary: "Calm, curious, and perfectly unimpressed by distractions." },
        chicken: { emoji: "Chicken", summary: "Chaotic, brave, and surprisingly motivating." },
        phoenix: { emoji: "Phoenix", summary: "Built for resets, recovery, and comeback sessions." },
        owl: { emoji: "Owl", summary: "Sharp-eyed and best at late-night focus." },
        fox: { emoji: "Fox", summary: "Quick, clever, and hard to distract for long." },
        wolf: { emoji: "Wolf", summary: "Disciplined, alert, and great at streaks." },
        bunny: { emoji: "Bunny", summary: "Soft energy with surprisingly strong consistency." },
        turtle: { emoji: "Turtle", summary: "Slow, steady, and made for deep work." }
    },
    petForms: [
        { name: "Paper Pup", note: "Learns to sit with you while you build the habit." },
        { name: "Sticky Scout", note: "Shows up after your first strong weekly milestone." },
        { name: "Marker Hero", note: "Starts feeling legendary once focus becomes consistent." },
        { name: "Sketch Guardian", note: "Protects your streaks and keeps the chaos low." }
    ]
};

const defaultState = {
    activeTab: "home",
    settings: {
        theme: "classic",
        paperTint: "#fdfbf7",
        soundMode: "off",
        showHints: true,
        petAppearance: "dragon"
    },
    focusEnvironment: {
        selected: "nature",
        selectedTrackId: "nature-1",
        isPlaying: false,
        volume: 55,
        customLink: "",
        customMediaType: "video"
    },
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
    appTabs: Array.from(document.querySelectorAll("[data-tab]")),
    appPanels: Array.from(document.querySelectorAll("[data-panel]")),
    heroStartBtn: document.getElementById("heroStartBtn"),
    heroPetBtn: document.getElementById("heroPetBtn"),
    homeFocusBtn: document.getElementById("homeFocusBtn"),
    focusHomeBtn: document.getElementById("focusHomeBtn"),
    startBtn: document.getElementById("startBtn"),
    resetWeekBtn: document.getElementById("resetWeekBtn"),
    completeBtn: document.getElementById("completeBtn"),
    distractedBtn: document.getElementById("distractedBtn"),
    breakBtn: document.getElementById("breakBtn"),
    failBtn: document.getElementById("failBtn"),
    sessionControls: document.getElementById("sessionControls"),
    sessionInfo: document.getElementById("sessionInfo"),
    sessionStatus: document.getElementById("sessionStatus"),
    timerDisplay: document.getElementById("timerDisplay"),
    timerNote: document.getElementById("timerNote"),
    weeklyHeadline: document.getElementById("weeklyHeadline"),
    weeklyCompleted: document.getElementById("weeklyCompleted"),
    weeklyDistractions: document.getElementById("weeklyDistractions"),
    breakInfo: document.getElementById("breakInfo"),
    distractionInfo: document.getElementById("distractionInfo"),
    focusDistractionCounter: document.getElementById("focusDistractionCounter"),
    focusBreakCounter: document.getElementById("focusBreakCounter"),
    output: document.getElementById("output"),
    storageToast: document.getElementById("storageToast"),
    activeEnvironmentLabel: document.getElementById("activeEnvironmentLabel"),
    currentTrackLabel: document.getElementById("currentTrackLabel"),
    natureTrackList: document.getElementById("natureTrackList"),
    noiseTrackList: document.getElementById("noiseTrackList"),
    handpanTrackList: document.getElementById("handpanTrackList"),
    focusMediaStage: document.getElementById("focusMediaStage"),
    focusMediaFrame: document.getElementById("focusMediaFrame"),
    focusMediaEmpty: document.getElementById("focusMediaEmpty"),
    focusGeneratedVisual: document.getElementById("focusGeneratedVisual"),
    focusGeneratedChip: document.getElementById("focusGeneratedChip"),
    focusGeneratedTitle: document.getElementById("focusGeneratedTitle"),
    focusGeneratedCaption: document.getElementById("focusGeneratedCaption"),
    focusMediaTitle: document.getElementById("focusMediaTitle"),
    focusMediaCaption: document.getElementById("focusMediaCaption"),
    focusMediaType: document.getElementById("focusMediaType"),
    environmentPlayBtn: document.getElementById("environmentPlayBtn"),
    environmentPauseBtn: document.getElementById("environmentPauseBtn"),
    environmentVolume: document.getElementById("environmentVolume"),
    environmentVolumeValue: document.getElementById("environmentVolumeValue"),
    showMediaBtn: document.getElementById("showMediaBtn"),
    customMediaInput: document.getElementById("customMediaInput"),
    saveCustomLinkBtn: document.getElementById("saveCustomLinkBtn"),
    openCustomLinkBtn: document.getElementById("openCustomLinkBtn"),
    removeCustomLinkBtn: document.getElementById("removeCustomLinkBtn"),
    savedCustomLink: document.getElementById("savedCustomLink"),
    customMediaTypeLabel: document.getElementById("customMediaTypeLabel"),
    petAvatar: document.getElementById("petAvatar"),
    petInfo: document.getElementById("petInfo"),
    petLevelDisplay: document.getElementById("petLevelDisplay"),
    petPortrait: document.querySelector(".pet-portrait"),
    petSketch: document.createElement("div"),
    petGoal: document.getElementById("petGoal"),
    petSummary: document.getElementById("petSummary"),
    welcomeMessage: document.getElementById("welcomeMessage"),
    petLevels: document.getElementById("petLevels"),
    heroPurpose: document.getElementById("heroPurpose"),
    homeEnvironmentSummary: document.getElementById("homeEnvironmentSummary"),
    homeEnvironmentDetail: document.getElementById("homeEnvironmentDetail"),
    homePetSummary: document.getElementById("homePetSummary"),
    homePetDetail: document.getElementById("homePetDetail"),
    homeMomentumSummary: document.getElementById("homeMomentumSummary"),
    homeMomentumDetail: document.getElementById("homeMomentumDetail"),
    themeSelect: document.getElementById("themeSelect"),
    paperTintInput: document.getElementById("paperTintInput"),
    paperTintValue: document.getElementById("paperTintValue"),
    soundModeSelect: document.getElementById("soundModeSelect"),
    hintsToggle: document.getElementById("hintsToggle"),
    petAppearanceSelect: document.getElementById("petAppearanceSelect")
};

let canUseStorage = detectStorageAvailability();
let state = loadState();
let timer = null;
let audioContext = null;
let activeSoundNodes = [];
let environmentSoundNodes = [];
let lastFocusEmbedUrl = "";
let activeGeneratedTrackId = "";

bindEvents();
elements.petSketch.className = "pet-sketch";
elements.petPortrait.prepend(elements.petSketch);
if (!canUseStorage) {
    showStorageWarning();
}
resumeRunningSessionIfNeeded();
render();
if (state.settings.soundMode !== "off") {
    syncSoundMode();
}
syncFocusEnvironment();

function bindEvents() {
    elements.appTabs.forEach((tabButton) => {
        tabButton.addEventListener("click", () => setActiveTab(tabButton.dataset.tab));
    });
    elements.natureTrackList.addEventListener("click", handleTrackSelection);
    elements.noiseTrackList.addEventListener("click", handleTrackSelection);
    elements.handpanTrackList.addEventListener("click", handleTrackSelection);
    elements.focusMediaFrame.addEventListener("load", handleFocusMediaFrameLoad);

    elements.heroStartBtn.addEventListener("click", () => {
        setActiveTab("focus");
        startSession();
    });
    elements.heroPetBtn.addEventListener("click", () => setActiveTab("pet"));
    elements.homeFocusBtn.addEventListener("click", () => setActiveTab("focus"));
    elements.focusHomeBtn.addEventListener("click", () => setActiveTab("home"));
    elements.startBtn.addEventListener("click", startSession);
    elements.completeBtn.addEventListener("click", completeSession);
    elements.distractedBtn.addEventListener("click", markDistracted);
    elements.breakBtn.addEventListener("click", takeBreak);
    elements.failBtn.addEventListener("click", failSession);
    elements.resetWeekBtn.addEventListener("click", resetWeek);
    elements.themeSelect.addEventListener("change", (event) => updateTheme(event.target.value));
    elements.paperTintInput.addEventListener("input", (event) => updatePaperTint(event.target.value));
    elements.soundModeSelect.addEventListener("change", (event) => updateSoundMode(event.target.value));
    elements.hintsToggle.addEventListener("change", (event) => updateHintsPreference(event.target.checked));
    elements.petAppearanceSelect.addEventListener("change", (event) => updatePetAppearance(event.target.value));
    elements.environmentPlayBtn.addEventListener("click", playEnvironment);
    elements.environmentPauseBtn.addEventListener("click", pauseEnvironment);
    elements.environmentVolume.addEventListener("input", (event) => updateEnvironmentVolume(event.target.value));
    elements.showMediaBtn.addEventListener("click", () => {
        syncFocusEnvironment(true);
        render();
    });
    elements.saveCustomLinkBtn.addEventListener("click", saveCustomMediaLink);
    elements.openCustomLinkBtn.addEventListener("click", openCustomMediaLink);
    elements.removeCustomLinkBtn.addEventListener("click", removeCustomMediaLink);
}

function setActiveTab(tabName) {
    state.activeTab = ["home", "focus", "pet", "settings"].includes(tabName) ? tabName : "home";
    saveAndRender();
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
        activeTab: normalizeTab(savedState.activeTab),
        settings: sanitizeSettings(savedState.settings),
        focusEnvironment: sanitizeFocusEnvironment(savedState.focusEnvironment),
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

function normalizeTab(value) {
    return ["home", "focus", "pet", "settings"].includes(value) ? value : "home";
}

function sanitizeSettings(savedSettings = {}) {
    return {
        theme: ["classic", "blueprint", "sunset"].includes(savedSettings.theme)
            ? savedSettings.theme
            : "classic",
        paperTint: typeof savedSettings.paperTint === "string" ? savedSettings.paperTint : "#fdfbf7",
        soundMode: ["off", "hum", "pulse", "noise"].includes(savedSettings.soundMode)
            ? savedSettings.soundMode
            : "off",
        showHints: savedSettings.showHints !== false,
        petAppearance: Object.hasOwn(CONFIG.petAppearances, savedSettings.petAppearance)
            ? savedSettings.petAppearance
            : "dragon"
    };
}

function sanitizeFocusEnvironment(savedEnvironment = {}) {
    const selected = normalizeEnvironmentKey(savedEnvironment.selected);
    const defaultTrackId = getDefaultTrackIdForEnvironment(selected);
    const candidateTrackId = typeof savedEnvironment.selectedTrackId === "string"
        ? savedEnvironment.selectedTrackId
        : defaultTrackId;
    const validTrackId = selected === "custom" || isTrackIdValidForEnvironment(selected, candidateTrackId)
        ? candidateTrackId
        : defaultTrackId;
    return {
        selected,
        selectedTrackId: validTrackId,
        isPlaying: Boolean(savedEnvironment.isPlaying),
        volume: Math.min(100, Math.max(0, toPositiveNumber(savedEnvironment.volume, 55))),
        customLink: typeof savedEnvironment.customLink === "string"
            ? savedEnvironment.customLink.trim()
            : "",
        customMediaType: ["video", "playlist", "spotify"].includes(savedEnvironment.customMediaType)
            ? savedEnvironment.customMediaType
            : "video"
    };
}

function normalizeEnvironmentKey(value) {
    if (["rain", "forest", "ocean", "nature"].includes(value)) {
        return "nature";
    }

    if (value === "noise" || value === "handpan" || value === "custom") {
        return value;
    }

    return "nature";
}

function isTrackIdValidForEnvironment(environmentKey, trackId) {
    return (CONFIG.builtInEnvironmentTracks[environmentKey] || []).some((track) => track.id === trackId);
}

function normalizeSessionState(value) {
    return ["idle", "running", "awaiting-result"].includes(value) ? value : "idle";
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
        render();
        return;
    }

    state.activeTab = "focus";
    state.currentDistractionCount = 0;
    state.currentBreakCount = 0;
    state.timeLeft = state.sessionDuration * 60;
    state.sessionState = "running";
    state.timerStartedAt = Date.now();
    state.timerEndsAt = state.timerStartedAt + (state.timeLeft * 1000);

    startTimer();
    updateOutput("Session started. Keep your head down and ride the messy momentum.");
    saveAndRender();
}

function startTimer() {
    stopTimer();

    timer = window.setInterval(() => {
        if (state.sessionState !== "running" || !state.timerEndsAt) {
            stopTimer();
            return;
        }

        state.timeLeft = Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000));

        if (state.timeLeft === 0) {
            stopTimer();
            state.sessionState = "awaiting-result";
            updateOutput("Time is up. Mark how the session went.");
            saveAndRender();
            return;
        }

        persistState();
        renderTimer();
        renderStatusBits();
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

    state.timeLeft = Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000));

    if (state.timeLeft === 0) {
        state.sessionState = "awaiting-result";
        state.timerStartedAt = null;
        state.timerEndsAt = null;
        updateOutput("Your earlier session ended while the page was closed. Mark the result now.");
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

    if (state.currentDistractionCount === 0 && state.successStreak >= CONFIG.cleanStreakRewardThreshold) {
        state.cleanStreakBonusSessionsLeft = CONFIG.cleanStreakRewardSessions;
        state.sessionDuration += CONFIG.cleanStreakRewardMinutes;
        updateOutput("Three clean sessions in a row. Your next sessions just got longer.");
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
        render();
        return;
    }

    state.currentDistractionCount += 1;

    if (state.currentDistractionCount >= CONFIG.distractionLimit) {
        state.sessionDuration = CONFIG.minimumSessionMinutes;
        state.successStreak = 0;
        updateOutput("Too many distractions. The next session resets to 10 minutes.");
    } else {
        updateOutput(`Distraction recorded. ${state.currentDistractionCount} of ${CONFIG.distractionLimit} this session.`);
    }

    saveAndRender();
}

function takeBreak() {
    if (state.sessionState !== "running") {
        updateOutput("Start a session first.");
        render();
        return;
    }

    state.currentBreakCount += 1;

    if (state.currentBreakCount >= CONFIG.breakLimit) {
        state.sessionDuration = Math.max(CONFIG.minimumSessionMinutes, state.sessionDuration - 5);
        state.successStreak = 0;
        updateOutput("Too many breaks. The next session is shorter.");
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
        state.sessionDuration = Math.max(CONFIG.minimumSessionMinutes, state.sessionDuration - 5);
        updateOutput("Two failed sessions in a row. Your next session is shorter.");
    } else {
        updateOutput("Session failed. Shake it off and try again.");
    }

    applyBonusCountdown();
    saveAndRender();
}

function canResolveSession() {
    if (state.sessionState === "idle") {
        updateOutput("Start a session first.");
        render();
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
    if (
        state.weeklyCompleted >= state.nextPetRewardThreshold &&
        getWeeklyAverage() <= CONFIG.petRewardMaxAverageDistractions
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
    renderTabs();
    applyThemeSettings();
    renderStatusBits();
    renderTimer();
    renderPet();
    renderHomeHighlights();
    renderSessionControls();
    renderSettings();
    renderFocusEnvironment();
    syncFocusEnvironment();
}

function renderTabs() {
    elements.appTabs.forEach((tabButton) => {
        const isActive = tabButton.dataset.tab === state.activeTab;
        tabButton.classList.toggle("is-active", isActive);
    });

    elements.appPanels.forEach((panel) => {
        const isActive = panel.dataset.panel === state.activeTab;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
    });
}

function renderStatusBits() {
    elements.sessionInfo.textContent = `${state.sessionDuration} minutes`;
    elements.sessionStatus.textContent = getSessionStatusLabel();
    elements.weeklyHeadline.textContent = `${state.weeklyCompleted} completed this week`;
    elements.weeklyCompleted.textContent = String(state.weeklyCompleted);
    elements.weeklyDistractions.textContent = getWeeklyAverage().toFixed(2);
    elements.breakInfo.textContent = String(state.currentBreakCount);
    elements.distractionInfo.textContent = String(state.currentDistractionCount);
    elements.focusDistractionCounter.textContent = `${state.currentDistractionCount} / ${CONFIG.distractionLimit}`;
    elements.focusBreakCounter.textContent = `${state.currentBreakCount} / ${CONFIG.breakLimit}`;
    elements.timerNote.textContent = getTimerNote();
    elements.startBtn.disabled = state.sessionState === "running";
    elements.startBtn.textContent = state.sessionState === "running" ? "Session Running" : "Start Session";
    elements.welcomeMessage.textContent = getWelcomeMessage();
    elements.heroPurpose.textContent = getHeroPurpose();
}

function renderSessionControls() {
    const isDisabled = state.sessionState === "idle";
    [elements.completeBtn, elements.distractedBtn, elements.breakBtn, elements.failBtn].forEach((button) => {
        button.disabled = isDisabled;
    });
}

function renderTimer() {
    const displaySeconds = state.sessionState === "idle"
        ? state.sessionDuration * 60
        : state.timeLeft;

    const minutes = Math.floor(displaySeconds / 60);
    const seconds = String(displaySeconds % 60).padStart(2, "0");
    elements.timerDisplay.textContent = `${minutes}:${seconds}`;
}

function renderPet() {
    const petForm = getCurrentPetForm();
    const petAppearance = getPetAppearance();
    const currentStage = getPetStageFromLevel(state.petLevel);
    elements.petAvatar.innerHTML = `
        <div class="pet-stamp-art">${getPetSketchMarkup(state.settings.petAppearance, currentStage.key)}</div>
        <div class="pet-stamp-copy">
            <strong>${petAppearance.emoji}</strong>
            <span>Lv ${state.petLevel}</span>
        </div>
    `;
    elements.petInfo.textContent = String(state.petLevel);
    elements.petLevelDisplay.textContent = `${petAppearance.emoji} ${currentStage.label} Level ${state.petLevel}`;
    elements.petGoal.textContent = `${state.nextPetRewardThreshold} sessions`;
    elements.petSummary.textContent = `${petAppearance.emoji}: ${petAppearance.summary} Current stage: ${currentStage.label}. ${petForm.name} form unlock energy comes from ${state.nextPetRewardThreshold} completed sessions with low distractions.`;
    elements.petPortrait.dataset.pet = state.settings.petAppearance;
    elements.petSketch.innerHTML = getPetSketchMarkup(state.settings.petAppearance, currentStage.key);
    renderPetLevelCards();
}

function renderHomeHighlights() {
    const descriptor = getCurrentEnvironmentDescriptor();
    const petAppearance = getPetAppearance();
    const stage = getPetStageFromLevel(state.petLevel);
    const cleanWins = Math.max(state.successStreak, 0);
    const sessionsRemaining = Math.max(state.nextPetRewardThreshold - state.weeklyCompleted, 0);
    const environmentDetail = descriptor.embedUrl === "about:blank"
        ? "Your focus tab is ready for a new media source."
        : `${descriptor.environmentLabel} is ${state.focusEnvironment.isPlaying ? "playing" : "loaded"} in the study box as a ${descriptor.typeLabel.toLowerCase()}.`;

    elements.homeEnvironmentSummary.textContent = descriptor.trackLabel;
    elements.homeEnvironmentDetail.textContent = environmentDetail;
    elements.homePetSummary.textContent = `${petAppearance.emoji} ${stage.label} · Lv ${state.petLevel}`;
    elements.homePetDetail.textContent = `${sessionsRemaining} more completed session${sessionsRemaining === 1 ? "" : "s"} until your next pet growth target.`;
    elements.homeMomentumSummary.textContent = `${cleanWins} clean win${cleanWins === 1 ? "" : "s"}`;
    elements.homeMomentumDetail.textContent = cleanWins >= CONFIG.cleanStreakRewardThreshold
        ? "You already earned a longer focus block. Keep the streak calm."
        : `${Math.max(CONFIG.cleanStreakRewardThreshold - cleanWins, 0)} clean session${CONFIG.cleanStreakRewardThreshold - cleanWins === 1 ? "" : "s"} left to unlock bonus time.`;
}

function renderSettings() {
    elements.themeSelect.value = state.settings.theme;
    elements.paperTintInput.value = normalizeColorValue(state.settings.paperTint);
    elements.paperTintValue.textContent = normalizeColorValue(state.settings.paperTint);
    elements.soundModeSelect.value = state.settings.soundMode;
    elements.hintsToggle.checked = state.settings.showHints;
    elements.petAppearanceSelect.value = state.settings.petAppearance;
}

function renderFocusEnvironment() {
    const descriptor = getCurrentEnvironmentDescriptor();
    elements.natureTrackList.innerHTML = renderTrackButtons("nature");
    elements.noiseTrackList.innerHTML = renderTrackButtons("noise");
    elements.handpanTrackList.innerHTML = renderTrackButtons("handpan");
    elements.activeEnvironmentLabel.textContent = descriptor.environmentLabel;
    elements.currentTrackLabel.textContent = descriptor.trackLabel;
    elements.environmentVolume.value = String(state.focusEnvironment.volume);
    elements.environmentVolumeValue.textContent = `${state.focusEnvironment.volume}%`;
    elements.environmentVolume.disabled = !descriptor.canAdjustVolume;
    elements.customMediaInput.value = state.focusEnvironment.customLink;
    elements.savedCustomLink.textContent = state.focusEnvironment.customLink
        ? state.focusEnvironment.customLink
        : "No custom link saved yet.";
    elements.customMediaTypeLabel.textContent = state.focusEnvironment.customLink
        ? `Saved source type: ${getSavedCustomSourceLabel()}`
        : "No saved custom source yet.";
    elements.openCustomLinkBtn.disabled = !state.focusEnvironment.customLink;
    elements.removeCustomLinkBtn.disabled = !state.focusEnvironment.customLink;
    elements.environmentPlayBtn.disabled = !descriptor.isGenerated && descriptor.embedUrl === "about:blank";
    elements.environmentPauseBtn.disabled = !descriptor.canPause;
    elements.focusMediaTitle.textContent = descriptor.title;
    elements.focusMediaCaption.textContent = descriptor.caption;
    elements.focusMediaType.textContent = descriptor.typeLabel;
    elements.focusMediaStage.dataset.shell = descriptor.shell || "empty";
    elements.focusMediaTitle.parentElement.dataset.shell = descriptor.shell || "empty";
    elements.focusMediaEmpty.textContent = descriptor.emptyMessage || "Choose a study source to load it here.";
    elements.focusMediaEmpty.hidden = descriptor.embedUrl !== "about:blank";
    elements.focusMediaFrame.hidden = descriptor.embedUrl === "about:blank";
    elements.focusGeneratedVisual.hidden = true;
    elements.focusGeneratedChip.textContent = descriptor.generatedChip || "Built-in environment";
    elements.focusGeneratedTitle.textContent = descriptor.generatedTitle || descriptor.title;
    elements.focusGeneratedCaption.textContent = descriptor.generatedCaption || descriptor.caption;
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

function getTimerNote() {
    if (state.sessionState === "running") {
        return "Timer is live. You can still mark a break or end the session early.";
    }

    if (state.sessionState === "awaiting-result") {
        return "Timer finished. Record the result to update your streak and pet.";
    }

    return "Start a focus block and let the clock run while you work.";
}

function getWelcomeMessage() {
    if (state.sessionState === "running") {
        return "You are in the middle of a focus session. Keep the noise down and protect the streak.";
    }

    if (state.weeklyCompleted >= state.nextPetRewardThreshold - 1) {
        return "You are close to the next pet milestone. One more strong session could do it.";
    }

    return "Start your next session, check your weekly stats, and keep an eye on your pet's progress.";
}

function getHeroPurpose() {
    if (state.settings.showHints) {
        return "A hand-drawn focus system that tracks distractions, adapts session length, and helps your pet grow with consistency.";
    }

    return "Adaptive focus support with cleaner sessions, pet progression, and fewer surprises.";
}

function getCurrentPetForm() {
    const index = Math.min(state.petLevel - 1, CONFIG.petForms.length - 1);
    return CONFIG.petForms[index];
}

function getPetAppearance() {
    return CONFIG.petAppearances[state.settings.petAppearance] || CONFIG.petAppearances.dragon;
}

function getPetStageFromLevel(levelNumber) {
    if (levelNumber <= 1) {
        return { key: "baby", label: "Baby" };
    }

    if (levelNumber === 2) {
        return { key: "teen", label: "Teen" };
    }

    return { key: "adult", label: "Adult" };
}

function renderPetLevelCards() {
    const petAppearance = getPetAppearance();
    const cardMarkup = [
        { key: "baby", label: "Level 1", title: `Baby ${petAppearance.emoji}`, body: "The first tiny version of your focus buddy. It appears when the habit is just getting started." },
        { key: "teen", label: "Level 2", title: `Teen ${petAppearance.emoji}`, body: "A scrappier middle stage that shows your rhythm is getting more reliable." },
        { key: "adult", label: "Level 3", title: `Adult ${petAppearance.emoji}`, body: "A full-grown companion that reflects stronger consistency and calmer sessions." }
    ].map((entry, index) => `
        <article class="level-card wobble-md ${Math.min(state.petLevel, 3) - 1 === index ? "is-current" : ""}">
            <div class="level-card-head">
                <div class="level-sketch">${getPetSketchMarkup(state.settings.petAppearance, entry.key)}</div>
                <div>
                    <span class="mini-label">${entry.label}</span>
                    <strong>${entry.title}</strong>
                </div>
            </div>
            <p>${entry.body}</p>
        </article>
    `).join("");

    elements.petLevels.innerHTML = cardMarkup;
}

function renderTrackButtons(environmentKey) {
    return (CONFIG.builtInEnvironmentTracks[environmentKey] || []).map((track) => {
        const isActive = state.focusEnvironment.selected === environmentKey && state.focusEnvironment.selectedTrackId === track.id;
        return `<button class="track-pill wobble-md ${isActive ? "is-active" : ""}" data-environment="${environmentKey}" data-track-id="${track.id}">${track.label}</button>`;
    }).join("");
}

function getPetSketchMarkup(petKey, stage = "baby") {
    const sketches = {
        dragon: `
            <svg viewBox="0 0 200 200" aria-hidden="true">
                <path d="${stage === "baby" ? "M52 136 C56 100, 80 72, 112 72 C142 72, 156 94, 150 126 C144 152, 120 166, 96 164 C72 162, 54 150, 52 136Z" : stage === "teen" ? "M46 132 C50 92, 78 58, 114 60 C148 62, 162 88, 156 124 C150 154, 124 170, 96 168 C68 166, 48 152, 46 132Z" : "M42 132 C45 88, 74 52, 118 56 C150 58, 166 86, 160 122 C154 152, 126 170, 96 168 C66 166, 46 152, 42 132Z"}" />
                <path d="M86 62 L72 34 L97 52" />
                <path d="M124 62 L146 36 L135 62" />
                <circle cx="86" cy="108" r="5" />
                <circle cx="122" cy="108" r="5" />
                <path d="M88 134 C101 142, 115 142, 126 132" />
                <path d="M153 112 C170 108, 176 126, 162 136" />
                ${stage === "teen" ? '<path d="M70 84 Q98 66 128 84" />' : ""}
                ${stage === "adult" ? '<path d="M64 78 L138 78" /><path d="M102 48 L112 32 L122 48" />' : ""}
            </svg>`,
        dog: `
            <svg viewBox="0 0 200 200" aria-hidden="true">
                <path d="${stage === "baby" ? "M64 132 C64 96, 82 74, 102 74 C124 74, 140 98, 140 130 C140 154, 122 168, 102 168 C80 168, 64 154, 64 132Z" : stage === "teen" ? "M56 128 C58 88, 82 62, 104 62 C132 62, 148 92, 146 128 C144 156, 126 170, 102 170 C76 170, 56 154, 56 128Z" : "M52 126 C54 84, 80 56, 104 56 C138 56, 154 88, 152 126 C150 156, 128 172, 102 172 C72 172, 52 156, 52 126Z"}" />
                <path d="M84 84 C64 78, 54 54, 62 38 C78 44, 88 58, 92 78" />
                <path d="M120 84 C140 78, 150 54, 142 38 C126 44, 116 58, 112 78" />
                <circle cx="88" cy="112" r="5" />
                <circle cx="116" cy="112" r="5" />
                <ellipse cx="102" cy="130" rx="20" ry="15" />
                <circle cx="102" cy="126" r="4" />
                <path d="M92 138 C96 144, 108 144, 112 138" />
                <path d="M82 126 Q102 112 122 126" />
                <path d="M86 148 Q102 156 118 148" />
                <path d="M74 100 Q82 94 90 98" />
                <path d="M114 98 Q122 94 130 100" />
                ${stage === "teen" ? '<path d="M78 82 Q102 70 126 82" /><path d="M80 150 Q102 164 124 150" />' : ""}
                ${stage === "adult" ? '<path d="M76 80 Q102 64 128 80" /><path d="M78 150 Q102 168 126 150" /><path d="M92 156 L112 156" />' : ""}
            </svg>`,
        cat: `
            <svg viewBox="0 0 200 200" aria-hidden="true">
                <path d="M48 128 C52 88, 74 60, 102 60 C132 60, 154 86, 154 126 C154 154, 130 170, 100 170 C68 170, 46 154, 48 128Z" />
                <path d="M74 66 L62 36 L88 56" />
                <path d="M126 66 L140 36 L112 56" />
                <circle cx="84" cy="112" r="5" />
                <circle cx="118" cy="112" r="5" />
                <path d="M94 128 L102 136 L110 128" />
                <line x1="52" y1="128" x2="82" y2="124" />
                <line x1="52" y1="138" x2="80" y2="136" />
                <line x1="148" y1="128" x2="118" y2="124" />
                <line x1="148" y1="138" x2="120" y2="136" />
                ${stage === "teen" ? '<path d="M78 82 Q102 70 126 82" />' : ""}
                ${stage === "adult" ? '<path d="M72 80 L132 80" /><path d="M92 80 L96 62 L108 62 L112 80" />' : ""}
            </svg>`,
        chicken: `
            <svg viewBox="0 0 200 200" aria-hidden="true">
                <path d="M52 128 C52 86, 76 58, 110 58 C142 58, 160 82, 158 116 C156 148, 132 166, 102 166 C74 166, 52 150, 52 128Z" />
                <path d="M88 52 C86 36, 102 30, 108 46" />
                <path d="M100 50 C102 34, 118 36, 114 54" />
                <path d="M112 54 C118 40, 132 46, 122 60" />
                <circle cx="92" cy="110" r="5" />
                <circle cx="122" cy="110" r="5" />
                <path d="M133 124 L154 132 L136 140 Z" />
                <path d="M86 140 C98 146, 110 146, 120 140" />
                ${stage === "teen" ? '<path d="M78 82 Q102 68 126 82" />' : ""}
                ${stage === "adult" ? '<path d="M76 80 L128 80" /><path d="M90 80 L94 62 L110 62 L114 80" />' : ""}
            </svg>`,
        phoenix: `
            <svg viewBox="0 0 200 200" aria-hidden="true">
                <path d="${stage === "baby" ? "M62 134 C66 100, 84 78, 104 78 C126 78, 142 100, 140 132 C138 154, 122 170, 102 170 C80 170, 62 154, 62 134Z" : stage === "teen" ? "M54 130 C58 92, 80 66, 106 66 C136 66, 150 94, 148 128 C146 156, 124 172, 100 172 C74 172, 54 154, 54 130Z" : "M48 126 C52 84, 78 56, 106 56 C140 56, 156 86, 154 124 C152 154, 126 174, 100 174 C70 174, 48 154, 48 126Z"}" />
                <path d="M86 82 C80 58, 92 42, 102 54 C104 38, 118 28, 124 48 C134 38, 148 44, 142 64" />
                <path d="M72 118 C54 108, 48 88, 64 82 C76 80, 88 90, 92 104" />
                <path d="M130 118 C148 108, 154 88, 138 82 C126 80, 114 90, 110 104" />
                <circle cx="88" cy="112" r="5" />
                <circle cx="118" cy="112" r="5" />
                <path d="M98 124 L112 124 L104 132 Z" />
                <path d="M90 138 C98 146, 110 146, 118 138" />
                <path d="M98 154 C92 166, 82 170, 74 166" />
                <path d="M106 154 C114 166, 126 170, 136 164" />
                ${stage === "teen" ? '<path d="M78 82 Q104 64 130 82" /><path d="M82 150 Q104 160 126 150" />' : ""}
                ${stage === "adult" ? '<path d="M72 80 Q104 54 136 80" /><path d="M76 146 Q104 166 132 146" /><path d="M100 52 L104 36 L110 52" />' : ""}
            </svg>`,
        owl: `
            <svg viewBox="0 0 200 200" aria-hidden="true">
                <path d="${stage === "baby" ? "M68 142 C68 108, 82 86, 102 86 C122 86, 136 108, 136 142 C136 156, 122 166, 102 166 C82 166, 68 156, 68 142Z" : stage === "teen" ? "M60 138 C60 98, 78 70, 102 70 C126 70, 144 98, 144 138 C144 156, 128 170, 102 170 C76 170, 60 156, 60 138Z" : "M54 136 C54 90, 76 58, 102 58 C128 58, 150 90, 150 136 C150 158, 130 174, 102 174 C74 174, 54 158, 54 136Z"}" />
                <circle cx="82" cy="112" r="${stage === "baby" ? "12" : "16"}" />
                <circle cx="122" cy="112" r="${stage === "baby" ? "12" : "16"}" />
                <circle cx="82" cy="112" r="4" />
                <circle cx="122" cy="112" r="4" />
                <path d="M98 132 L102 138 L106 132" />
                <path d="M72 74 L82 60 L92 74" />
                <path d="M112 74 L122 60 L132 74" />
                ${stage === "teen" ? '<path d="M72 82 Q102 56 132 82" /><path d="M78 78 L86 66" /><path d="M126 78 L118 66" />' : ""}
                ${stage === "adult" ? '<path d="M70 78 L134 78" /><path d="M84 78 L88 58 L116 58 L120 78" /><path d="M92 140 L112 140" /><path d="M102 140 L102 154" />' : ""}
            </svg>`,
        fox: `
            <svg viewBox="0 0 200 200" aria-hidden="true">
                <path d="M48 128 C54 90, 76 60, 102 60 C130 60, 150 90, 152 126 C154 152, 130 166, 102 168 C76 170, 50 154, 48 128Z" />
                <path d="M72 68 L54 36 L86 56" />
                <path d="M128 68 L148 38 L116 56" />
                <circle cx="84" cy="110" r="5" />
                <circle cx="118" cy="110" r="5" />
                <path d="M92 130 C102 140, 114 140, 124 130" />
                ${stage === "teen" ? '<path d="M76 82 Q102 68 128 82" />' : ""}
                ${stage === "adult" ? '<path d="M72 78 L132 78" /><path d="M92 78 L96 60 L108 60 L112 78" />' : ""}
            </svg>`,
        wolf: `
            <svg viewBox="0 0 200 200" aria-hidden="true">
                <path d="M46 130 C52 90, 74 58, 102 58 C132 58, 152 90, 154 128 C156 154, 132 170, 102 170 C72 170, 48 154, 46 130Z" />
                <path d="M70 64 L54 34 L84 56" />
                <path d="M132 64 L150 34 L120 56" />
                <circle cx="84" cy="112" r="5" />
                <circle cx="118" cy="112" r="5" />
                <path d="M92 136 C101 144, 112 144, 122 136" />
                <path d="M100 128 L110 128" />
                ${stage === "teen" ? '<path d="M74 82 Q102 66 130 82" />' : ""}
                ${stage === "adult" ? '<path d="M70 78 L136 78" /><path d="M90 78 L94 58 L110 58 L114 78" />' : ""}
            </svg>`,
        bunny: `
            <svg viewBox="0 0 200 200" aria-hidden="true">
                <path d="M56 132 C56 92, 76 64, 102 64 C130 64, 146 92, 146 130 C146 156, 128 170, 102 170 C76 170, 56 156, 56 132Z" />
                <path d="M80 66 C72 22, 98 14, 98 58" />
                <path d="M122 66 C128 22, 154 18, 130 60" />
                <circle cx="84" cy="114" r="5" />
                <circle cx="118" cy="114" r="5" />
                <path d="M96 130 L102 136 L108 130" />
                ${stage === "teen" ? '<path d="M76 86 Q102 72 126 86" />' : ""}
                ${stage === "adult" ? '<path d="M74 82 L130 82" /><path d="M92 82 L96 64 L108 64 L112 82" />' : ""}
            </svg>`,
        turtle: `
            <svg viewBox="0 0 200 200" aria-hidden="true">
                <path d="${stage === "baby" ? "M62 132 C66 108, 82 90, 102 90 C122 90, 138 108, 142 132 C144 150, 126 162, 102 162 C78 162, 60 150, 62 132Z" : stage === "teen" ? "M54 128 C58 98, 76 76, 102 76 C128 76, 146 98, 150 128 C152 150, 132 166, 102 166 C72 166, 52 150, 54 128Z" : "M48 124 C52 92, 74 70, 102 70 C130 70, 152 92, 156 124 C160 150, 134 166, 102 166 C70 166, 44 150, 48 124Z"}" />
                <path d="M70 118 C82 106, 96 102, 110 104 C124 106, 136 114, 140 126" />
                <circle cx="88" cy="118" r="4" />
                <circle cx="118" cy="118" r="4" />
                <path d="M94 138 C102 144, 110 144, 118 138" />
                ${stage === "teen" ? '<path d="M78 90 Q102 74 126 90" />' : ""}
                ${stage === "adult" ? '<path d="M72 86 L132 86" /><path d="M92 86 L96 68 L108 68 L112 86" />' : ""}
            </svg>`
    };

    return sketches[petKey] || sketches.dragon;
}

function getEnvironmentLabel(environmentKey) {
    const labels = {
        nature: "Nature",
        noise: "Noise",
        handpan: "Handpan",
        custom: "Custom Link"
    };

    return labels[environmentKey] || "None selected";
}

function getDefaultTrackIdForEnvironment(environmentKey) {
    const tracks = CONFIG.builtInEnvironmentTracks[environmentKey] || [];
    return tracks[0]?.id || "";
}

function getSelectedBuiltInTrack() {
    const environmentKey = state.focusEnvironment.selected === "custom"
        ? "nature"
        : state.focusEnvironment.selected;
    const tracks = CONFIG.builtInEnvironmentTracks[environmentKey] || [];
    return tracks.find((track) => track.id === state.focusEnvironment.selectedTrackId) || tracks[0] || null;
}

function isLocalFileMode() {
    return window.location.protocol === "file:";
}

function buildLocalYouTubeBlockedDescriptor(baseDescriptor) {
    return {
        ...baseDescriptor,
        caption: "YouTube blocks embedded playback when Friction is opened as a local file. Open the app through localhost and the study box will work again.",
        provider: "none",
        shell: "empty",
        embedUrl: "about:blank",
        canPause: false,
        canAdjustVolume: false,
        emptyMessage: "YouTube media is blocked in local file mode. Open Friction through localhost to use videos and playlists here."
    };
}

function getCurrentEnvironmentDescriptor() {
    if (state.focusEnvironment.selected === "custom") {
        const customLink = state.focusEnvironment.customLink.trim();
        if (!customLink) {
            return {
                environmentLabel: "Custom Link",
                trackLabel: "No custom source saved",
                title: "Custom source ready",
                caption: "Paste a YouTube or Spotify link on the right to load it in the study box.",
                typeLabel: "No media loaded",
                selectedTypeLabel: "No media loaded",
                provider: "none",
                shell: "empty",
                isGenerated: false,
                embedUrl: "about:blank",
                emptyMessage: "Choose a study source to load it here.",
                canPause: false,
                canAdjustVolume: false
            };
        }

        const youtubeData = extractYouTubeData(customLink);
        if (youtubeData) {
            const isPlaylist = youtubeData.type === "playlist";
            const isMusic = youtubeData.app === "ytmusic";
            const appName = isMusic ? "YouTube Music" : "YouTube";
            const isRadioStylePlaylist = isMusic && isPlaylist && youtubeData.value.startsWith("RD");
            const youtubeDescriptor = {
                environmentLabel: "Custom Link",
                trackLabel: isPlaylist ? `Custom ${appName} Playlist` : `Custom ${appName} Video`,
                title: isPlaylist ? `Custom ${appName} Playlist` : `Custom ${appName} Video`,
                caption: isPlaylist
                    ? (isRadioStylePlaylist
                        ? "This YouTube Music radio-style playlist is saved, but YouTube usually blocks these from playing inside embeds. Use Open Source for the full playlist."
                        : `Your ${appName} playlist is loaded in the study box so it feels closer to the actual app while you study.`)
                    : "Your custom video is loaded inside Friction so you do not have to bounce to another tab.",
                typeLabel: isPlaylist ? `${appName} playlist` : `${appName} video`,
                selectedTypeLabel: isPlaylist ? `${appName} playlist` : `${appName} video`,
                provider: "youtube",
                shell: isPlaylist ? (isMusic ? "ytmusic-playlist" : "youtube-playlist") : "youtube-video",
                isGenerated: false,
                embedUrl: isRadioStylePlaylist ? "about:blank" : buildCustomEmbedUrl(customLink),
                emptyMessage: isRadioStylePlaylist
                    ? "This YouTube Music radio playlist cannot be embedded here. Use Open Source for the full playlist."
                    : "Choose a study source to load it here.",
                canPause: !isRadioStylePlaylist,
                canAdjustVolume: true
            };

            if (isLocalFileMode() && !isRadioStylePlaylist) {
                return buildLocalYouTubeBlockedDescriptor(youtubeDescriptor);
            }

            return youtubeDescriptor;
        }

        const spotifyData = extractSpotifyData(customLink);
        if (spotifyData) {
            const spotifyLabel = `Spotify ${capitalizeWord(spotifyData.type)}`;
            return {
                environmentLabel: "Custom Link",
                trackLabel: spotifyLabel,
                title: spotifyLabel,
                caption: "Spotify is embedded in a playlist-style holder, but full playback can still depend on Spotify sign-in and Spotify's own preview rules.",
                typeLabel: "Spotify embed",
                selectedTypeLabel: "Spotify embed",
                provider: "spotify",
                shell: spotifyData.type === "playlist" ? "spotify-playlist" : "spotify-track",
                isGenerated: false,
                embedUrl: buildCustomEmbedUrl(customLink),
                emptyMessage: "Choose a study source to load it here.",
                canPause: false,
                canAdjustVolume: false
            };
        }
    }

    const environmentKey = state.focusEnvironment.selected === "custom" ? "nature" : state.focusEnvironment.selected;
    const track = getSelectedBuiltInTrack();
    const youtubeData = track ? extractYouTubeData(track.url) : null;
    const typeLabel = youtubeData?.app === "ytmusic"
        ? (youtubeData?.type === "playlist" ? "YouTube Music playlist" : "YouTube Music video")
        : (youtubeData?.type === "playlist" ? "YouTube playlist" : "YouTube video");
    const builtInDescriptor = {
        environmentLabel: getEnvironmentLabel(environmentKey),
        trackLabel: track?.label || "No track selected",
        title: track?.label || "No track selected",
        caption: track
            ? `${track.label} is loaded from your PDF music list inside the study box.`
            : "Pick a built-in source to load it in the study box.",
        typeLabel,
        selectedTypeLabel: typeLabel,
        provider: "youtube",
        shell: youtubeData?.app === "ytmusic"
            ? "ytmusic-playlist"
            : (youtubeData?.type === "playlist" ? "youtube-playlist" : "youtube-video"),
        isGenerated: false,
        embedUrl: track ? buildCustomEmbedUrl(track.url) : "about:blank",
        emptyMessage: track
            ? "YouTube media is blocked in local file mode. Open Friction through localhost to use videos and playlists here."
            : "Choose a study source to load it here.",
        canPause: Boolean(track),
        canAdjustVolume: Boolean(track)
    };

    if (track && isLocalFileMode()) {
        return buildLocalYouTubeBlockedDescriptor(builtInDescriptor);
    }

    return builtInDescriptor;
}

function getSavedCustomSourceLabel() {
    if (!state.focusEnvironment.customLink) {
        return "No media loaded";
    }

    const youtubeData = extractYouTubeData(state.focusEnvironment.customLink);
    if (youtubeData) {
        const appName = youtubeData.app === "ytmusic" ? "YouTube Music" : "YouTube";
        return youtubeData.type === "playlist" ? `${appName} playlist` : `${appName} video`;
    }

    const spotifyData = extractSpotifyData(state.focusEnvironment.customLink);
    if (spotifyData) {
        return "Spotify embed";
    }

    return "Embedded source";
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
    elements.storageToast.hidden = false;
}

function updateTheme(themeName) {
    state.settings.theme = ["classic", "blueprint", "sunset"].includes(themeName) ? themeName : "classic";
    saveAndRender();
}

function updatePaperTint(colorValue) {
    state.settings.paperTint = normalizeColorValue(colorValue);
    saveAndRender();
}

function updateHintsPreference(isEnabled) {
    state.settings.showHints = Boolean(isEnabled);
    saveAndRender();
}

function updatePetAppearance(appearanceKey) {
    state.settings.petAppearance = Object.hasOwn(CONFIG.petAppearances, appearanceKey)
        ? appearanceKey
        : "dragon";
    saveAndRender();
}

function updateSoundMode(soundMode) {
    state.settings.soundMode = ["off", "hum", "pulse", "noise"].includes(soundMode) ? soundMode : "off";
    syncSoundMode();
    saveAndRender();
}

function handleTrackSelection(event) {
    const target = event.target.closest("[data-track-id]");
    if (!target) {
        return;
    }

    selectBuiltInTrack(target.dataset.environment, target.dataset.trackId);
}

function selectBuiltInTrack(environmentKey, trackId) {
    if (!CONFIG.environmentOptions.includes(environmentKey) || environmentKey === "custom") {
        return;
    }

    if (!isTrackIdValidForEnvironment(environmentKey, trackId)) {
        return;
    }

    state.focusEnvironment.selected = environmentKey;
    state.focusEnvironment.selectedTrackId = trackId;
    syncFocusEnvironment();
    saveAndRender();
}

function playEnvironment() {
    const descriptor = getCurrentEnvironmentDescriptor();
    if (descriptor.embedUrl === "about:blank") {
        updateOutput(descriptor.emptyMessage || "Pick a study source first or save a custom YouTube or Spotify link.");
        render();
        return;
    }

    state.focusEnvironment.isPlaying = true;
    syncFocusEnvironment();
    requestEmbeddedPlay();
    saveAndRender();
}

function pauseEnvironment() {
    const descriptor = getCurrentEnvironmentDescriptor();
    if (!descriptor.canPause) {
        updateOutput("This source keeps its own controls inside the embedded player.");
        render();
        return;
    }

    state.focusEnvironment.isPlaying = false;
    requestEmbeddedPause();
    saveAndRender();
}

function updateEnvironmentVolume(volumeValue) {
    state.focusEnvironment.volume = Math.min(100, Math.max(0, Number(volumeValue) || 0));
    applyEmbeddedVolume();
    saveAndRender();
}

function saveCustomMediaLink() {
    const value = elements.customMediaInput.value.trim();
    if (!value) {
        updateOutput("Paste a YouTube or Spotify URL before saving.");
        render();
        return;
    }

    const customEmbed = buildCustomEmbedUrl(value);
    if (customEmbed === "about:blank") {
        updateOutput("Save a full YouTube or Spotify link so Friction can embed it here.");
        render();
        return;
    }

    state.focusEnvironment.customLink = value;
    state.focusEnvironment.customMediaType = getCustomMediaType(value);
    state.focusEnvironment.selected = "custom";
    updateOutput("Custom study link saved.");
    syncFocusEnvironment();
    saveAndRender();
}

function openCustomMediaLink() {
    if (!state.focusEnvironment.customLink) {
        updateOutput("No custom link saved yet.");
        render();
        return;
    }

    window.open(state.focusEnvironment.customLink, "_blank", "noopener,noreferrer");
}

function removeCustomMediaLink() {
    state.focusEnvironment.customLink = "";
    state.focusEnvironment.customMediaType = "video";
    state.focusEnvironment.isPlaying = false;
    if (state.focusEnvironment.selected === "custom") {
        state.focusEnvironment.selected = "nature";
        state.focusEnvironment.selectedTrackId = getDefaultTrackIdForEnvironment("nature");
    }
    syncFocusEnvironment();
    updateOutput("Custom study link removed.");
    saveAndRender();
}

function applyThemeSettings() {
    document.body.classList.remove("theme-blueprint", "theme-sunset");

    if (state.settings.theme === "blueprint") {
        document.body.classList.add("theme-blueprint");
    } else if (state.settings.theme === "sunset") {
        document.body.classList.add("theme-sunset");
    }

    document.body.style.setProperty("--paper-custom", normalizeColorValue(state.settings.paperTint));
}

function normalizeColorValue(colorValue) {
    return /^#[0-9a-fA-F]{6}$/.test(colorValue) ? colorValue : "#fdfbf7";
}

function getOrCreateAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        return null;
    }

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => {
            updateOutput("Audio may need another tap because the browser blocked autoplay.");
        });
    }

    return audioContext;
}

function syncSoundMode() {
    stopBackgroundSound();

    if (state.settings.soundMode === "off") {
        return;
    }

    const context = getOrCreateAudioContext();
    if (!context) {
        updateOutput("Background sound is not supported in this browser.");
        return;
    }

    if (state.settings.soundMode === "hum") {
        createHumSound();
    } else if (state.settings.soundMode === "pulse") {
        createPulseSound();
    } else if (state.settings.soundMode === "noise") {
        createNoiseSound();
    }
}

function syncFocusEnvironment(forceReload = false) {
    const descriptor = getCurrentEnvironmentDescriptor();
    const embedUrl = descriptor.embedUrl;

    if (forceReload || lastFocusEmbedUrl !== embedUrl) {
        elements.focusMediaFrame.src = embedUrl;
        lastFocusEmbedUrl = embedUrl;
    }

    elements.focusMediaFrame.dataset.provider = descriptor.provider;
    elements.focusMediaStage.dataset.shell = descriptor.shell || "empty";
    elements.focusMediaEmpty.textContent = descriptor.emptyMessage || "Choose a study source to load it here.";
    elements.focusMediaFrame.hidden = embedUrl === "about:blank";
    elements.focusMediaEmpty.hidden = embedUrl !== "about:blank";
    elements.focusGeneratedVisual.hidden = true;

    if (embedUrl !== "about:blank" && lastFocusEmbedUrl === embedUrl) {
        applyEmbeddedVolume();
        if (state.focusEnvironment.isPlaying) {
            requestEmbeddedPlay();
        } else {
            requestEmbeddedPause();
        }
    }
}

function handleFocusMediaFrameLoad() {
    const descriptor = getCurrentEnvironmentDescriptor();
    elements.focusMediaFrame.dataset.provider = descriptor.provider;
    applyEmbeddedVolume();
    if (state.focusEnvironment.isPlaying) {
        requestEmbeddedPlay();
    }
}

function requestEmbeddedPlay() {
    const descriptor = getCurrentEnvironmentDescriptor();
    if (descriptor.provider === "youtube") {
        sendYouTubeCommand("playVideo");
    }
}

function requestEmbeddedPause() {
    const descriptor = getCurrentEnvironmentDescriptor();
    if (descriptor.provider === "youtube") {
        sendYouTubeCommand("pauseVideo");
    }
}

function applyEmbeddedVolume() {
    const descriptor = getCurrentEnvironmentDescriptor();
    if (descriptor.provider === "youtube") {
        sendYouTubeCommand("setVolume", [state.focusEnvironment.volume]);
    }
}

function sendYouTubeCommand(commandName, args = []) {
    const frameWindow = elements.focusMediaFrame.contentWindow;
    if (!frameWindow || lastFocusEmbedUrl === "about:blank") {
        return;
    }

    frameWindow.postMessage(JSON.stringify({
        event: "command",
        func: commandName,
        args
    }), "*");
}

function stopBackgroundSound() {
    activeSoundNodes.forEach((node) => {
        try {
            if (node.stop) {
                node.stop();
            }
            node.disconnect();
        } catch (error) {
            console.warn("Unable to stop sound node.", error);
        }
    });
    activeSoundNodes = [];
}

function stopGeneratedEnvironment() {
    environmentSoundNodes.forEach((node) => {
        try {
            if (node.stop) {
                node.stop();
            }
            if (node.disconnect) {
                node.disconnect();
            }
        } catch (error) {
            console.warn("Unable to stop environment node.", error);
        }
    });
    environmentSoundNodes = [];
    activeGeneratedTrackId = "";
}

function startGeneratedEnvironment() {
    const descriptor = getCurrentEnvironmentDescriptor();
    const track = getSelectedBuiltInTrack();
    if (!descriptor.isGenerated || !track) {
        return;
    }

    const context = getOrCreateAudioContext();
    if (!context) {
        updateOutput("Built-in environments are not supported in this browser.");
        return;
    }

    stopGeneratedEnvironment();
    activeGeneratedTrackId = track.id;

    if (track.generator === "forest") {
        createForestEnvironment();
    } else if (track.generator === "ocean") {
        createOceanEnvironment();
    } else if (track.generator === "river") {
        createRiverEnvironment();
    } else if (track.generator === "brown-noise") {
        createBrownNoiseEnvironment();
    } else if (track.generator === "rain-noise") {
        createRainNoiseEnvironment();
    } else if (track.generator === "fan-noise") {
        createFanNoiseEnvironment();
    } else if (track.generator === "handpan-dawn") {
        createHandpanEnvironment([220, 261.63, 293.66, 329.63]);
    } else if (track.generator === "handpan-echo") {
        createHandpanEnvironment([196, 246.94, 293.66, 349.23]);
    } else if (track.generator === "handpan-night") {
        createHandpanEnvironment([174.61, 220, 261.63, 311.13]);
    }

    updateGeneratedEnvironmentVolume();
}

function updateGeneratedEnvironmentVolume() {
    const volume = Math.max(0.001, state.focusEnvironment.volume / 100);
    environmentSoundNodes.forEach((node) => {
        if (node?.gain?.value !== undefined && node.dataset === "environment-gain") {
            node.gain.value = volume * Number(node.multiplier || 1);
        }
    });
}

function createEnvironmentGain(multiplier) {
    const gain = audioContext.createGain();
    gain.dataset = "environment-gain";
    gain.multiplier = multiplier;
    gain.gain.value = Math.max(0.001, state.focusEnvironment.volume / 100) * multiplier;
    gain.connect(audioContext.destination);
    environmentSoundNodes.push(gain);
    return gain;
}

function createLoopingNoise(color = "white", filterType = "lowpass", frequency = 800, multiplier = 0.18) {
    const bufferSize = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let index = 0; index < bufferSize; index += 1) {
        const white = Math.random() * 2 - 1;
        if (color === "brown") {
            lastOut = (lastOut + (0.02 * white)) / 1.02;
            data[index] = lastOut * 3.5;
        } else {
            data[index] = white * 0.35;
        }
    }

    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = createEnvironmentGain(multiplier);
    source.buffer = buffer;
    source.loop = true;
    filter.type = filterType;
    filter.frequency.value = frequency;
    source.connect(filter);
    filter.connect(gain);
    source.start();
    environmentSoundNodes.push(source, filter);
}

function createForestEnvironment() {
    createLoopingNoise("white", "bandpass", 950, 0.11);
    createChirpLayer([880, 1174, 1318], 1.9, 0.035);
}

function createOceanEnvironment() {
    createLoopingNoise("brown", "lowpass", 420, 0.18);
    createSlowSwell(0.08, 0.14, 0.11);
}

function createRiverEnvironment() {
    createLoopingNoise("white", "highpass", 500, 0.12);
    createLoopingNoise("white", "bandpass", 1400, 0.06);
}

function createBrownNoiseEnvironment() {
    createLoopingNoise("brown", "lowpass", 520, 0.24);
}

function createRainNoiseEnvironment() {
    createLoopingNoise("white", "bandpass", 1600, 0.18);
    createLoopingNoise("brown", "lowpass", 480, 0.09);
}

function createFanNoiseEnvironment() {
    createLoopingNoise("white", "lowpass", 300, 0.14);
    const hum = createOscillatorNode("sine", 88, 0.025, environmentSoundNodes);
    hum.gain.disconnect();
    hum.gain.connect(createEnvironmentGain(0.55));
}

function createChirpLayer(notes, rateSeconds, multiplier) {
    const intervalId = window.setInterval(() => {
        if (state.sessionState === "idle" && !state.focusEnvironment.isPlaying) {
            return;
        }
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.value = notes[Math.floor(Math.random() * notes.length)];
        gain.gain.value = 0.0001;
        oscillator.connect(gain);
        gain.connect(createEnvironmentGain(multiplier));
        oscillator.start();
        gain.gain.exponentialRampToValueAtTime(1, audioContext.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.22);
        oscillator.stop(audioContext.currentTime + 0.24);
    }, rateSeconds * 1000);

    environmentSoundNodes.push({
        stop() {
            window.clearInterval(intervalId);
        },
        disconnect() {}
    });
}

function createSlowSwell(min, max, multiplier) {
    const oscillator = audioContext.createOscillator();
    const gainNode = createEnvironmentGain(multiplier);
    const modGain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 0.07;
    modGain.gain.value = (max - min) / 2;
    gainNode.gain.value = (min + max) / 2;
    oscillator.connect(modGain);
    modGain.connect(gainNode.gain);
    oscillator.start();
    environmentSoundNodes.push(oscillator, modGain);
}

function createHandpanEnvironment(scale) {
    const intervalId = window.setInterval(() => {
        const oscillator = audioContext.createOscillator();
        const overtone = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const out = createEnvironmentGain(0.12);
        const note = scale[Math.floor(Math.random() * scale.length)];
        oscillator.type = "sine";
        overtone.type = "triangle";
        oscillator.frequency.value = note;
        overtone.frequency.value = note * 2;
        gain.gain.value = 0.0001;
        oscillator.connect(gain);
        overtone.connect(gain);
        gain.connect(out);
        oscillator.start();
        overtone.start();
        gain.gain.exponentialRampToValueAtTime(1, audioContext.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1.8);
        oscillator.stop(audioContext.currentTime + 1.85);
        overtone.stop(audioContext.currentTime + 1.85);
    }, 1700);

    environmentSoundNodes.push({
        stop() {
            window.clearInterval(intervalId);
        },
        disconnect() {}
    });
}

function createHumSound() {
    const base = createOscillatorNode("sine", 174, 0.018);
    const harmony = createOscillatorNode("triangle", 261, 0.012);
    activeSoundNodes.push(base.oscillator, base.gain, harmony.oscillator, harmony.gain);
}

function createPulseSound() {
    const tone = createOscillatorNode("triangle", 220, 0.001);
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    lfo.type = "sine";
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain);
    lfoGain.connect(tone.gain.gain);
    lfo.start();
    activeSoundNodes.push(tone.oscillator, tone.gain, lfo, lfoGain);
}

function createNoiseSound() {
    const bufferSize = audioContext.sampleRate * 2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < bufferSize; index += 1) {
        data[index] = (Math.random() * 2 - 1) * 0.12;
    }

    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    noise.buffer = buffer;
    noise.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = 700;
    gain.gain.value = 0.04;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    noise.start();
    activeSoundNodes.push(noise, filter, gain);
}

function createOscillatorNode(type, frequency, volume, bucket = activeSoundNodes) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    bucket.push(oscillator, gain);
    return { oscillator, gain };
}

function buildFocusEnvironmentEmbedUrl() {
    return getCurrentEnvironmentDescriptor().embedUrl;
}

function buildCustomEmbedUrl(rawUrl) {
    if (!rawUrl) {
        return "about:blank";
    }

    const trimmed = rawUrl.trim();

    const youtubeMatch = extractYouTubeData(trimmed);
    if (youtubeMatch) {
        if (youtubeMatch.type === "playlist") {
            if (youtubeMatch.videoId) {
                return `https://www.youtube.com/embed/${youtubeMatch.videoId}?enablejsapi=1&controls=1&rel=0&loop=1&list=${youtubeMatch.value}&playlist=${youtubeMatch.videoId}`;
            }
            return `https://www.youtube.com/embed/videoseries?list=${youtubeMatch.value}&enablejsapi=1&loop=1&controls=1&rel=0`;
        }

        const playlistParam = youtubeMatch.playlist ? `&list=${youtubeMatch.playlist}` : "";
        return `https://www.youtube.com/embed/${youtubeMatch.value}?enablejsapi=1&controls=1&rel=0&loop=1&playlist=${youtubeMatch.value}${playlistParam}`;
    }

    const spotifyMatch = extractSpotifyData(trimmed);
    if (spotifyMatch) {
        return `https://open.spotify.com/embed/${spotifyMatch.type}/${spotifyMatch.value}?utm_source=generator`;
    }

    return "about:blank";
}

function getCustomMediaType(rawUrl) {
    const youtubeMatch = extractYouTubeData(rawUrl);
    if (youtubeMatch) {
        return youtubeMatch.type === "playlist" ? "playlist" : "video";
    }

    const spotifyMatch = extractSpotifyData(rawUrl);
    if (spotifyMatch) {
        return "spotify";
    }

    return "video";
}

function extractYouTubeData(urlString) {
    try {
        const url = new URL(urlString);
        const host = url.hostname.replace("www.", "");
        const app = host.includes("music.youtube.com") ? "ytmusic" : "youtube";

        if (host === "youtu.be") {
            const videoId = url.pathname.replace("/", "");
            const playlistId = url.searchParams.get("list") || "";
            return {
                type: playlistId ? "playlist" : "video",
                value: playlistId || videoId,
                playlist: playlistId,
                videoId,
                app
            };
        }

        if (host.includes("youtube.com")) {
            if (url.pathname === "/watch") {
                const videoId = url.searchParams.get("v");
                const playlistId = url.searchParams.get("list");
                if (playlistId) {
                    return { type: "playlist", value: playlistId, app, videoId: videoId || "" };
                }
                if (videoId) {
                    return { type: "video", value: videoId, playlist: playlistId || "", app };
                }
            }

            if (url.pathname.startsWith("/playlist")) {
                const playlistId = url.searchParams.get("list");
                if (playlistId) {
                    return { type: "playlist", value: playlistId, app };
                }
            }

            if (url.pathname.startsWith("/embed/")) {
                return { type: "video", value: url.pathname.split("/embed/")[1], playlist: url.searchParams.get("list") || "", app };
            }
        }
    } catch (error) {
        return null;
    }

    return null;
}

function capitalizeWord(value) {
    return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "";
}

function extractSpotifyData(urlString) {
    try {
        const url = new URL(urlString);
        if (!url.hostname.includes("spotify.com")) {
            return null;
        }

        const parts = url.pathname.split("/").filter(Boolean);
        const typeIndex = parts.findIndex((part) => ["playlist", "track", "album", "episode", "show"].includes(part));
        if (typeIndex >= 0 && parts[typeIndex + 1]) {
            return { type: parts[typeIndex], value: parts[typeIndex + 1] };
        }
    } catch (error) {
        return null;
    }

    return null;
}
