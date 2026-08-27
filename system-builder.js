const APP_KEY = "friction-v1-state";
const SYSTEM_KEY = "friction-system-builder-v1";
const obstacles = [
    "The task feels too large", "I do not know where to begin", "My phone distracts me",
    "I procrastinate until it is too late", "I lose motivation after a few days", "Schoolwork makes me too tired",
    "My schedule changes frequently", "I create unrealistic plans", "Missing one day makes me give up",
    "I forget what I planned", "I do not see progress quickly", "My work environment is not helpful"
];
const petVoices = {
    dragon: ["Dragon", "ember voice", "I am guarding the door. Perfection is not getting through today."],
    dog: ["Dog", "loyal voice", "I am right here with you. No judgment, just the next step."],
    cat: ["Cat", "cool voice", "We are not panicking. Panicking is deeply inefficient."],
    chicken: ["Chicken", "brave voice", "Small wings, big courage, immediate action."],
    phoenix: ["Phoenix", "comeback voice", "A rough start is still starting material."],
    owl: ["Owl", "wise voice", "Look only at the branch in front of you."],
    fox: ["Fox", "clever voice", "We will outsmart the task by making it smaller."],
    wolf: ["Wolf", "steady voice", "Breathe, square up, and keep moving."],
    bunny: ["Bunny", "gentle voice", "Soft start, brave heart, tiny steps."],
    turtle: ["Turtle", "slow steady voice", "No rush, no drama, just the next step."]
};
const spellingCorrections = {
    "teh": "the", "thier": "their", "recieve": "receive", "becuase": "because", "bcuz": "because",
    "definately": "definitely", "seperate": "separate", "enviroment": "environment", "enviornment": "environment",
    "wrok": "work", "wroking": "working", "proejct": "project", "projcet": "project", "maotivtion": "motivation",
    "movtivation": "motivation", "movtivstion": "motivation", "plana": "plan", "paln": "plan",
    "studdy": "study", "exersice": "exercise", "excersise": "exercise", "assignemnt": "assignment",
    "assigment": "assignment", "homeowrk": "homework", "homwork": "homework", "reserach": "research",
    "writting": "writing", "tomorow": "tomorrow", "tommorow": "tomorrow", "responsiblities": "responsibilities",
    "distractons": "distractions", "consistant": "consistent", "consistancy": "consistency", "sucess": "success",
    "sucessful": "successful", "acheive": "achieve", "acheiving": "achieving", "neccessary": "necessary",
    "nessacary": "necessary", "probaly": "probably", "prolly": "probably", "dont": "do not",
    "cant": "cannot", "wont": "will not", "im": "I am", "ive": "I have"
};
let store = loadStore();
let builderStep = 0;
let activeSystemId = null;
let editingSystemId = null;
let motivation = { speech: "", step: "" };
let dotFieldContext = null;
let dotFieldFrame = null;
let dotFieldLastFrameAt = 0;
let dotFieldPixelRatio = 1;
let dotFieldWidth = 0;
let dotFieldHeight = 0;
let dotFieldDots = [];
let dotFieldMouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
let dotFieldEngagement = 0;
const autocorrectTimers = new WeakMap();
let dotFieldPalette = {
    dotStart: "rgba(45, 93, 161, 0.46)",
    dotEnd: "rgba(45, 93, 161, 0.18)",
    glowStart: "rgba(45, 93, 161, 0.14)",
    glowEnd: "rgba(45, 93, 161, 0)"
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
initializeCompanionApp();

async function initializeCompanionApp() {
    const canOpenHostedPage = await window.FrictionAccess?.guardHostedPage?.();
    if (canOpenHostedPage === false) {
        return;
    }

    const obstacleChoices = $("#obstacleChoices");
    obstacleChoices.innerHTML = obstacles.map((item, index) => `<label><input type="checkbox" name="obstacles" value="${escapeHtml(item)}"><span>${escapeHtml(item)}</span></label>`).join("");

    bindEvents();
    applyAppTheme();
    initializeDotField();
    loadMotivationState();
    openWorkspace(location.hash === "#systems" ? "systems" : "motivation");
    renderDashboard();
}

function bindEvents() {
    $$("[data-workspace]").forEach(button => button.addEventListener("click", () => openWorkspace(button.dataset.workspace)));
    $("#motivationForm").addEventListener("submit", generateMotivation);
    $("#readMotivationBtn").addEventListener("click", readMotivation);
    $("#sendMotivationBtn").addEventListener("click", () => sendToFocus(motivation.step));
    $("#newSystemBtn").addEventListener("click", openBuilder);
    $("#closeBuilderBtn").addEventListener("click", closeBuilder);
    $("#builderNextBtn").addEventListener("click", nextBuilderStep);
    $("#builderBackBtn").addEventListener("click", previousBuilderStep);
    $("#builderForm").addEventListener("submit", activateSystem);
    $("#systemsList").addEventListener("click", handleSystemCardClick);
    setupBuilderAutocorrect();
}

function openWorkspace(name) {
    $$("[data-workspace]").forEach(button => button.classList.toggle("is-active", button.dataset.workspace === name));
    $$("[data-view]").forEach(view => { view.hidden = view.dataset.view !== name; view.classList.toggle("is-active", view.dataset.view === name); });
    history.replaceState(null, "", `#${name}`);
}

function loadStore() {
    try { return { systems: [], autocorrectEnabled: true, ...JSON.parse(localStorage.getItem(SYSTEM_KEY) || "{}") }; }
    catch { return { systems: [], autocorrectEnabled: true }; }
}
function saveStore() { localStorage.setItem(SYSTEM_KEY, JSON.stringify(store)); }
function getAppState() { try { return JSON.parse(localStorage.getItem(APP_KEY) || "{}"); } catch { return {}; } }
function applyAppTheme() {
    const app = getAppState();
    const settings = app.settings || {};
    const themes = ["blueprint", "sunset", "forest", "midnight", "citrus", "white", "black"];
    const shapes = ["doodles", "orbit", "confetti", "calm", "minimal"];
    document.body.classList.remove(...themes.map(theme => `theme-${theme}`));
    document.body.classList.remove(...shapes.map(shape => `shapes-${shape}`));
    if (themes.includes(settings.theme)) document.body.classList.add(`theme-${settings.theme}`);
    document.body.classList.add(`shapes-${shapes.includes(settings.backgroundShape) ? settings.backgroundShape : "doodles"}`);
    document.body.classList.toggle("sketch-motion-paused", settings.motionBackground === false);
    const paperTint = /^#[0-9a-fA-F]{6}$/.test(settings.paperTint || "") ? settings.paperTint : "#fdfbf7";
    document.body.style.setProperty("--paper-custom", paperTint);
    syncDotField();
}
function initializeDotField() {
    const canvas = $("#dotFieldCanvas");
    if (!canvas || !("getContext" in canvas)) return;
    dotFieldContext = canvas.getContext("2d", { alpha: true });
    if (!dotFieldContext) return;
    window.addEventListener("resize", resizeDotField, { passive: true });
    document.addEventListener("visibilitychange", syncDotField);
    window.addEventListener("mousemove", handleDotFieldMouseMove, { passive: true });
    window.addEventListener("mouseleave", clearDotFieldMouse, { passive: true });
    resizeDotField();
}
function resizeDotField() {
    const canvas = $("#dotFieldCanvas");
    if (!canvas || !dotFieldContext) return;
    dotFieldPixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    dotFieldWidth = Math.max(1, window.innerWidth);
    dotFieldHeight = Math.max(1, window.innerHeight);
    canvas.width = Math.round(dotFieldWidth * dotFieldPixelRatio);
    canvas.height = Math.round(dotFieldHeight * dotFieldPixelRatio);
    canvas.style.width = `${dotFieldWidth}px`;
    canvas.style.height = `${dotFieldHeight}px`;
    buildDotField(dotFieldWidth, dotFieldHeight);
    syncDotField();
}
function buildDotField(width, height) {
    const dotRadius = 1.5;
    const dotSpacing = 14;
    const step = dotRadius + dotSpacing;
    const cols = Math.max(1, Math.floor(width / step));
    const rows = Math.max(1, Math.floor(height / step));
    const padX = (width % step) / 2;
    const padY = (height % step) / 2;
    const dots = new Array(cols * rows);
    let index = 0;
    for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
            const ax = padX + col * step + step / 2;
            const ay = padY + row * step + step / 2;
            dots[index] = { ax, ay, sx: ax, sy: ay };
            index += 1;
        }
    }
    dotFieldDots = dots;
}
function handleDotFieldMouseMove(event) {
    dotFieldMouse.x = event.clientX;
    dotFieldMouse.y = event.clientY;
}
function clearDotFieldMouse() {
    dotFieldMouse.x = -9999;
    dotFieldMouse.y = -9999;
}
function updateDotFieldMouseSpeed() {
    const mouse = dotFieldMouse;
    const dx = mouse.prevX - mouse.x;
    const dy = mouse.prevY - mouse.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    mouse.speed += (distance - mouse.speed) * 0.5;
    if (mouse.speed < 0.001) mouse.speed = 0;
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
}
function parseCssColor(colorValue) {
    if (!colorValue) return null;
    const color = colorValue.trim();
    const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
        const value = hexMatch[1];
        const expanded = value.length === 3 ? value.split("").map(char => char + char).join("") : value;
        return [
            Number.parseInt(expanded.slice(0, 2), 16),
            Number.parseInt(expanded.slice(2, 4), 16),
            Number.parseInt(expanded.slice(4, 6), 16)
        ];
    }
    const rgbMatch = color.match(/rgba?\(\s*([0-9.]+)[,\s]+([0-9.]+)[,\s]+([0-9.]+)/i);
    return rgbMatch ? [Math.round(Number(rgbMatch[1])), Math.round(Number(rgbMatch[2])), Math.round(Number(rgbMatch[3]))] : null;
}
function getRelativeLuminance([red, green, blue]) {
    const [r, g, b] = [red, green, blue].map(value => {
        const channel = Math.min(255, Math.max(0, value)) / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function getColorContrast(firstColor, secondColor) {
    const firstLum = getRelativeLuminance(firstColor);
    const secondLum = getRelativeLuminance(secondColor);
    const light = Math.max(firstLum, secondLum);
    const dark = Math.min(firstLum, secondLum);
    return (light + 0.05) / (dark + 0.05);
}
function rgba(color, alpha) {
    return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}
function refreshDotFieldPalette() {
    const styles = window.getComputedStyle(document.body);
    const background = parseCssColor(styles.backgroundColor)
        || parseCssColor(styles.getPropertyValue("--paper-custom"))
        || [253, 251, 247];
    const candidates = [
        parseCssColor(styles.getPropertyValue("--blue")),
        parseCssColor(styles.getPropertyValue("--ink")),
        parseCssColor(styles.getPropertyValue("--accent")),
        [255, 255, 255],
        [28, 32, 38]
    ].filter(Boolean);
    const bestCandidate = candidates.reduce((best, candidate) => {
        return getColorContrast(candidate, background) > getColorContrast(best, background) ? candidate : best;
    }, candidates[0]);
    const backgroundIsDark = getRelativeLuminance(background) < 0.56;
    const dotColor = backgroundIsDark || getColorContrast(bestCandidate, background) < 2.2
        ? [255, 255, 255]
        : bestCandidate;
    const glowColor = backgroundIsDark ? [255, 255, 255] : dotColor;
    dotFieldPalette = {
        dotStart: rgba(dotColor, backgroundIsDark ? 0.92 : 0.46),
        dotEnd: rgba(dotColor, backgroundIsDark ? 0.52 : 0.18),
        glowStart: rgba(glowColor, backgroundIsDark ? 0.24 : 0.14),
        glowEnd: rgba(glowColor, 0)
    };
}
function syncDotField() {
    if (!dotFieldContext) return;
    if (dotFieldFrame) {
        window.cancelAnimationFrame(dotFieldFrame);
        dotFieldFrame = null;
    }
    const motionPaused = document.body.classList.contains("sketch-motion-paused")
        || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
        || document.hidden;
    refreshDotFieldPalette();
    drawDotField();
    if (motionPaused) return;
    dotFieldLastFrameAt = 0;
    dotFieldFrame = window.requestAnimationFrame(animateDotField);
}
function animateDotField(time) {
    if (document.body.classList.contains("sketch-motion-paused") || document.hidden) {
        dotFieldFrame = null;
        return;
    }
    if (time - dotFieldLastFrameAt >= 84) {
        updateDotFieldMouseSpeed();
        drawDotField();
        dotFieldLastFrameAt = time;
    }
    dotFieldFrame = window.requestAnimationFrame(animateDotField);
}
function drawDotField() {
    if (!dotFieldContext || !dotFieldWidth || !dotFieldHeight) return;
    const context = dotFieldContext;
    const width = dotFieldWidth;
    const height = dotFieldHeight;
    const mouse = dotFieldMouse;
    const cursorRadius = 500;
    const bulgeStrength = 67;
    const dotRadius = 1.5;
    const hasPointer = mouse.x > -1000;
    const targetEngagement = hasPointer ? Math.min(mouse.speed / 5, 1) : 0;
    dotFieldEngagement += (targetEngagement - dotFieldEngagement) * 0.08;
    context.setTransform(dotFieldPixelRatio, 0, 0, dotFieldPixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, dotFieldPalette.dotStart);
    gradient.addColorStop(1, dotFieldPalette.dotEnd);
    context.fillStyle = gradient;
    context.beginPath();
    for (const dot of dotFieldDots) {
        const dx = mouse.x - dot.ax;
        const dy = mouse.y - dot.ay;
        const distanceSquared = dx * dx + dy * dy;
        if (hasPointer && distanceSquared < cursorRadius * cursorRadius && dotFieldEngagement > 0.01) {
            const distance = Math.sqrt(distanceSquared);
            const falloff = 1 - distance / cursorRadius;
            const push = falloff * falloff * bulgeStrength * dotFieldEngagement;
            const angle = Math.atan2(dy, dx);
            dot.sx += (dot.ax - Math.cos(angle) * push - dot.sx) * 0.15;
            dot.sy += (dot.ay - Math.sin(angle) * push - dot.sy) * 0.15;
        } else {
            dot.sx += (dot.ax - dot.sx) * 0.1;
            dot.sy += (dot.ay - dot.sy) * 0.1;
        }
        context.moveTo(dot.sx + dotRadius, dot.sy);
        context.arc(dot.sx, dot.sy, dotRadius, 0, Math.PI * 2);
    }
    context.fill();
    if (hasPointer && dotFieldEngagement > 0.01) {
        const glow = context.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 160);
        glow.addColorStop(0, dotFieldPalette.glowStart);
        glow.addColorStop(1, dotFieldPalette.glowEnd);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(mouse.x, mouse.y, 160, 0, Math.PI * 2);
        context.fill();
    }
}
function loadMotivationState() {
    const app = getAppState();
    const petKey = app.settings?.petAppearance || "dragon";
    const pet = petVoices[petKey] || petVoices.dragon;
    $("#petName").textContent = pet[0];
    $("#petVoiceLabel").textContent = `${pet[0]} ${pet[1]}`;
    $("#motivationGoal").value = app.motivation?.goal || app.systemTask || "";
    $("#petPortrait").dataset.pet = petVoices[petKey] ? petKey : "dragon";
    $("#petPortrait").innerHTML = `${getCompanionPetSketchMarkup(petKey)}<strong id="petName">${pet[0]}</strong>`;
}

function getLegacyCompanionPetSketchMarkup(petKey) {
    const icons = {
        dragon: `<svg class="companion-pet-svg" viewBox="0 0 160 160" aria-hidden="true"><path class="pet-body" d="M34 108 C38 68 62 42 92 44 C122 46 136 70 130 102 C125 130 101 144 74 140 C49 137 32 126 34 108Z"/><path class="pet-soft" d="M64 50 L50 24 L78 42"/><path class="pet-soft" d="M104 50 L126 26 L117 54"/><path class="pet-accent" d="M124 90 C144 88 148 111 130 118"/><circle cx="68" cy="86" r="5"/><circle cx="100" cy="86" r="5"/><path d="M72 110 C84 118 98 118 108 108"/><path d="M84 42 L92 24 L101 42"/></svg>`,
        dog: `<svg class="companion-pet-svg" viewBox="0 0 160 160" aria-hidden="true"><path class="pet-body" d="M42 102 C43 66 62 42 82 42 C108 42 124 68 123 102 C122 128 103 142 80 142 C55 142 41 127 42 102Z"/><path class="pet-soft" d="M64 56 C48 48 42 28 50 18 C64 26 70 38 72 54"/><path class="pet-soft" d="M100 56 C116 48 122 28 114 18 C100 26 94 38 92 54"/><ellipse class="pet-soft" cx="82" cy="104" rx="22" ry="16"/><circle cx="68" cy="86" r="5"/><circle cx="96" cy="86" r="5"/><circle cx="82" cy="99" r="4"/><path d="M72 114 C78 121 88 121 94 114"/></svg>`,
        cat: `<svg class="companion-pet-svg" viewBox="0 0 160 160" aria-hidden="true"><path class="pet-body" d="M36 102 C40 64 62 38 82 38 C108 38 126 64 126 101 C126 126 104 141 80 141 C54 141 34 126 36 102Z"/><path class="pet-soft" d="M58 45 L48 18 L74 38"/><path class="pet-soft" d="M106 45 L118 18 L92 38"/><circle cx="66" cy="86" r="5"/><circle cx="96" cy="86" r="5"/><path d="M74 104 L82 111 L90 104"/><path d="M38 102 L65 99"/><path d="M38 113 L64 111"/><path d="M124 102 L99 99"/><path d="M124 113 L100 111"/></svg>`,
        chicken: `<svg class="companion-pet-svg" viewBox="0 0 160 160" aria-hidden="true"><path class="pet-body" d="M38 102 C39 64 62 38 90 39 C116 40 132 62 130 94 C128 124 105 140 78 138 C53 136 37 123 38 102Z"/><path class="pet-accent" d="M70 38 C68 20 84 18 86 36"/><path class="pet-accent" d="M84 36 C88 18 102 22 96 40"/><path class="pet-accent" d="M105 96 L132 105 L108 115 Z"/><circle cx="72" cy="84" r="5"/><circle cx="98" cy="84" r="5"/><path d="M68 112 C80 119 92 119 102 111"/></svg>`,
        phoenix: `<svg class="companion-pet-svg" viewBox="0 0 160 160" aria-hidden="true"><path class="pet-body" d="M46 106 C50 68 70 45 90 45 C115 45 130 70 127 104 C124 130 103 145 78 142 C54 139 44 126 46 106Z"/><path class="pet-accent" d="M68 48 C64 28 76 19 84 34 C88 19 104 16 105 38 C118 28 130 36 120 51"/><path class="pet-soft" d="M58 95 C38 86 40 62 62 63 C72 65 78 75 80 89"/><path class="pet-soft" d="M110 95 C132 86 128 62 108 63 C98 65 91 75 88 89"/><circle cx="72" cy="86" r="5"/><circle cx="98" cy="86" r="5"/><path d="M76 111 C86 119 98 118 106 109"/></svg>`,
        owl: `<svg class="companion-pet-svg" viewBox="0 0 160 160" aria-hidden="true"><path class="pet-body" d="M48 108 C48 68 63 44 82 44 C101 44 116 68 116 108 C116 128 102 142 82 142 C62 142 48 128 48 108Z"/><path class="pet-soft" d="M58 48 L68 32 L78 48"/><path class="pet-soft" d="M88 48 L98 32 L108 48"/><circle class="pet-soft" cx="68" cy="84" r="15"/><circle class="pet-soft" cx="96" cy="84" r="15"/><circle cx="68" cy="84" r="5"/><circle cx="96" cy="84" r="5"/><path d="M78 108 L82 116 L87 108"/></svg>`,
        fox: `<svg class="companion-pet-svg" viewBox="0 0 160 160" aria-hidden="true"><path class="pet-body" d="M34 102 C42 62 62 38 82 38 C106 38 124 63 128 101 C131 125 105 140 80 141 C56 142 32 126 34 102Z"/><path class="pet-soft" d="M58 46 L42 18 L76 38"/><path class="pet-soft" d="M106 46 L124 20 L90 38"/><path class="pet-soft" d="M62 114 C72 132 92 132 104 114 C91 121 75 121 62 114Z"/><circle cx="66" cy="84" r="5"/><circle cx="98" cy="84" r="5"/><path d="M72 104 C82 113 94 113 104 104"/></svg>`,
        wolf: `<svg class="companion-pet-svg" viewBox="0 0 160 160" aria-hidden="true"><path class="pet-body" d="M34 104 C40 62 62 36 82 36 C108 36 126 64 128 103 C130 128 106 143 80 143 C52 143 32 128 34 104Z"/><path class="pet-soft" d="M58 44 L44 16 L74 38"/><path class="pet-soft" d="M108 44 L124 16 L92 38"/><path class="pet-soft" d="M66 116 C78 127 93 127 106 116"/><circle cx="66" cy="86" r="5"/><circle cx="98" cy="86" r="5"/><path d="M72 106 L94 106"/><path d="M76 118 C84 124 94 123 102 116"/></svg>`,
        bunny: `<svg class="companion-pet-svg" viewBox="0 0 160 160" aria-hidden="true"><path class="pet-body" d="M42 104 C42 66 62 42 82 42 C107 42 121 67 121 103 C121 128 104 142 82 142 C58 142 42 128 42 104Z"/><path class="pet-soft" d="M64 47 C56 10 82 8 82 42"/><path class="pet-soft" d="M100 48 C108 10 132 12 108 44"/><circle cx="68" cy="88" r="5"/><circle cx="96" cy="88" r="5"/><path d="M76 106 L82 113 L88 106"/><path d="M70 122 C78 128 88 128 96 122"/></svg>`,
        turtle: `<svg class="companion-pet-svg" viewBox="0 0 160 160" aria-hidden="true"><path class="pet-body" d="M36 102 C42 76 60 60 82 60 C104 60 122 76 128 102 C132 124 108 137 82 137 C56 137 32 124 36 102Z"/><path class="pet-soft" d="M58 92 C69 78 88 75 106 92"/><path class="pet-accent" d="M118 98 C140 94 144 116 126 122"/><circle cx="68" cy="98" r="5"/><circle cx="96" cy="98" r="5"/><path d="M72 116 C82 123 92 123 102 116"/><path d="M58 132 L48 146"/><path d="M106 132 L116 146"/></svg>`
    };
    return icons[petKey] || icons.dragon;
}

function getCompanionPetSketchMarkup(petKey) {
    const icons = {
        dragon: `<path class="pet-accent" d="M46 108 C24 103 20 78 42 70 C55 66 66 78 68 96"/><path class="pet-accent" d="M112 95 C140 88 149 111 127 124"/><path class="pet-body" d="M38 105 C37 67 62 43 90 43 C120 43 137 66 134 98 C131 128 105 144 78 141 C54 139 39 126 38 105Z"/><path class="pet-soft" d="M62 48 L50 19 L77 39"/><path class="pet-soft" d="M105 48 L126 21 L116 52"/><path class="pet-accent" d="M79 42 L88 23 L98 42"/><path class="pet-accent" d="M91 43 L99 28 L108 45"/><path class="pet-accent" d="M76 40 C84 22 98 22 104 40 C116 26 130 36 118 52"/><path class="pet-detail" d="M55 82 C63 74 75 72 84 79"/><circle cx="68" cy="88" r="5"/><circle cx="100" cy="88" r="5"/><path class="pet-detail" d="M74 111 C84 119 99 119 109 109"/>`,
        dog: `<path class="pet-body" d="M42 102 C43 67 62 42 82 42 C108 42 124 68 123 102 C122 128 103 143 80 143 C55 143 41 127 42 102Z"/><path class="pet-accent" d="M64 56 C48 49 42 29 50 18 C65 25 71 39 72 55"/><path class="pet-accent" d="M100 56 C116 49 122 29 114 18 C99 25 93 39 92 55"/><ellipse class="pet-soft" cx="82" cy="104" rx="22" ry="16"/><path class="pet-soft" d="M56 78 C62 70 71 68 78 74"/><circle cx="68" cy="86" r="5"/><circle cx="96" cy="86" r="5"/><circle cx="82" cy="99" r="4"/><path class="pet-detail" d="M72 114 C78 121 88 121 94 114"/><path class="pet-detail" d="M64 124 C78 133 100 133 114 124"/>`,
        cat: `<path class="pet-body" d="M36 102 C40 64 62 38 82 38 C108 38 126 64 126 101 C126 126 104 142 80 142 C54 142 34 126 36 102Z"/><path class="pet-soft" d="M58 45 L48 18 L74 38"/><path class="pet-soft" d="M106 45 L118 18 L92 38"/><path class="pet-accent" d="M61 69 C69 60 80 60 87 68"/><path class="pet-accent" d="M104 69 C96 60 86 60 79 68"/><circle cx="66" cy="86" r="5"/><circle cx="96" cy="86" r="5"/><path class="pet-detail" d="M74 104 L82 111 L90 104"/><path class="pet-detail" d="M38 102 L65 99"/><path class="pet-detail" d="M38 113 L64 111"/><path class="pet-detail" d="M124 102 L99 99"/><path class="pet-detail" d="M124 113 L100 111"/>`,
        chicken: `<path class="pet-body" d="M38 103 C39 64 62 38 90 39 C116 40 132 62 130 94 C128 124 105 141 78 139 C53 137 37 123 38 103Z"/><path class="pet-accent" d="M70 38 C68 20 84 18 86 36"/><path class="pet-accent" d="M84 36 C88 17 103 22 96 40"/><path class="pet-accent" d="M104 42 C112 25 126 34 114 50"/><path class="pet-accent" d="M106 95 L135 105 L108 116 Z"/><path class="pet-soft" d="M54 107 C48 92 54 76 70 71"/><path class="pet-detail" d="M75 139 L70 150"/><path class="pet-detail" d="M91 139 L99 150"/><circle cx="72" cy="84" r="5"/><circle cx="98" cy="84" r="5"/><path class="pet-detail" d="M68 112 C80 119 92 119 102 111"/>`,
        phoenix: `<path class="pet-soft" d="M59 97 C34 91 35 62 61 61 C74 61 82 75 82 91"/><path class="pet-soft" d="M108 97 C134 91 132 62 107 61 C94 61 87 75 86 91"/><path class="pet-body" d="M46 106 C50 68 70 45 90 45 C115 45 130 70 127 104 C124 130 103 145 78 142 C54 139 44 126 46 106Z"/><path class="pet-accent" d="M68 48 C64 27 76 18 84 34 C88 18 104 16 105 38 C119 27 132 36 120 51"/><path class="pet-accent" d="M75 138 C64 154 48 153 42 141"/><path class="pet-accent" d="M91 140 C104 155 123 152 128 138"/><circle cx="72" cy="86" r="5"/><circle cx="98" cy="86" r="5"/><path class="pet-detail" d="M76 111 C86 119 98 118 106 109"/>`,
        owl: `<path class="pet-body" d="M47 108 C47 68 63 43 82 43 C102 43 118 68 117 108 C117 129 102 143 82 143 C62 143 47 129 47 108Z"/><path class="pet-accent" d="M57 49 L68 30 L80 49"/><path class="pet-accent" d="M87 49 L99 30 L110 49"/><circle class="pet-soft" cx="68" cy="84" r="16"/><circle class="pet-soft" cx="96" cy="84" r="16"/><circle cx="68" cy="84" r="5"/><circle cx="96" cy="84" r="5"/><path class="pet-detail" d="M78 108 L82 116 L87 108"/><path class="pet-detail" d="M64 124 C75 132 91 132 102 124"/><path class="pet-detail" d="M70 58 C78 52 88 52 96 58"/>`,
        fox: `<path class="pet-accent" d="M120 107 C149 112 145 145 110 133"/><path class="pet-body" d="M34 102 C42 62 62 38 82 38 C106 38 124 63 128 101 C131 125 105 141 80 142 C56 143 32 126 34 102Z"/><path class="pet-accent" d="M58 46 L42 18 L76 38"/><path class="pet-accent" d="M106 46 L124 20 L90 38"/><path class="pet-soft" d="M61 112 C72 132 93 132 106 112 C92 121 75 121 61 112Z"/><path class="pet-soft" d="M80 101 L91 101 L85 114 Z"/><circle cx="66" cy="84" r="5"/><circle cx="98" cy="84" r="5"/><path class="pet-detail" d="M72 104 C82 113 94 113 104 104"/>`,
        wolf: `<path class="pet-body" d="M34 104 C40 62 62 36 82 36 C108 36 126 64 128 103 C130 128 106 143 80 143 C52 143 32 128 34 104Z"/><path class="pet-accent" d="M57 44 L43 15 L75 38"/><path class="pet-accent" d="M109 44 L125 15 L91 38"/><path class="pet-accent" d="M48 69 C59 50 79 43 98 48"/><path class="pet-soft" d="M64 115 C78 129 95 129 108 115"/><path class="pet-soft" d="M79 101 L97 101 L88 115 Z"/><circle cx="66" cy="86" r="5"/><circle cx="98" cy="86" r="5"/><path class="pet-detail" d="M72 106 L94 106"/><path class="pet-detail" d="M76 118 C84 124 94 123 102 116"/><path class="pet-detail" d="M62 67 C76 58 94 58 108 67"/>`,
        bunny: `<path class="pet-body" d="M42 104 C42 66 62 42 82 42 C107 42 121 67 121 103 C121 128 104 142 82 142 C58 142 42 128 42 104Z"/><path class="pet-soft" d="M63 48 C54 9 82 7 82 42"/><path class="pet-soft" d="M100 48 C109 9 134 12 108 44"/><path class="pet-accent" d="M68 49 C64 23 77 20 78 44"/><path class="pet-accent" d="M104 48 C111 24 123 24 110 45"/><circle cx="68" cy="88" r="5"/><circle cx="96" cy="88" r="5"/><path class="pet-detail" d="M76 106 L82 113 L88 106"/><path class="pet-detail" d="M70 122 C78 128 88 128 96 122"/><path class="pet-accent" d="M58 124 C50 134 36 130 40 118"/>`,
        turtle: `<path class="pet-accent" d="M119 98 C141 94 146 116 127 123"/><path class="pet-body" d="M36 102 C42 76 60 60 82 60 C104 60 122 76 128 102 C132 124 108 137 82 137 C56 137 32 124 36 102Z"/><path class="pet-soft" d="M57 93 C68 77 90 75 107 93"/><path class="pet-accent" d="M44 101 C24 96 22 116 38 122"/><circle cx="68" cy="98" r="5"/><circle cx="96" cy="98" r="5"/><path class="pet-detail" d="M72 116 C82 123 92 123 102 116"/><path class="pet-detail" d="M58 132 L48 146"/><path class="pet-detail" d="M106 132 L116 146"/><path class="pet-detail" d="M68 88 L78 103 L91 84 L103 103"/>`
    };
    return `<svg class="companion-pet-svg" viewBox="0 0 160 160" aria-hidden="true"><path class="pet-sticker-shadow" d="M38 145 C58 154 108 154 130 144 C116 158 57 160 38 145Z"/>${icons[petKey] || icons.dragon}</svg>`;
}

function generateMotivation(event) {
    event.preventDefault();
    const goal = $("#motivationGoal").value.trim() || "the project in front of you";
    const mood = $("#motivationBlock").value;
    const pet = petVoices[getAppState().settings?.petAppearance] || petVoices.dragon;
    const moodLines = {
        stuck: "You do not need the whole answer. You need one honest move.", tired: "Low energy still counts. Aim for a small win.",
        overwhelmed: "The big version can wait. Make the work fit in your hands.", avoidant: "Make the first step too small to fear.",
        deadline: "Pressure is loud, so be quieter and more specific.", reset: "A reset means choosing the next clean action from here."
    };
    motivation.step = suggestedStep(goal);
    motivation.speech = `${pet[2]} ${moodLines[mood]} Your goal: ${goal}. For the next ten minutes, ${motivation.step}.`;
    $("#motivationTitle").textContent = `${pet[0]} says: start tiny, then keep moving.`;
    $("#motivationSpeech").textContent = motivation.speech;
    $("#motivationNextStep").textContent = `Next step: ${motivation.step}`;
    $("#motivationNextStep").hidden = false;
    $("#visualIdeasLink").href = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${goal} motivation visual ideas`)}`;
    const app = getAppState();
    app.motivation = { ...(app.motivation || {}), goal, mood, lastSpeech: motivation.speech };
    localStorage.setItem(APP_KEY, JSON.stringify(app));
}
function suggestedStep(goal) {
    const text = goal.toLowerCase();
    if (/\b(essay|write|paper|draft)\b|application essay|college application/.test(text)) return "write one rough sentence that is allowed to be messy";
    if (/\b(presentation|slides|speech)\b|science project/.test(text)) return "open the presentation and complete one rough slide or outline point";
    if (/\b(code|app|website|bug|project)\b/.test(text)) return "open the most important file and fix one visible thing";
    if (/\b(study|test|exam|quiz|homework)\b/.test(text)) return "answer one question and review why it was right or wrong";
    if (/\b(clean|organize|room|desk)\b/.test(text)) return "clear one small surface";
    return "set a tiny timer and touch the easiest piece of the work";
}
function readMotivation() {
    if (!motivation.speech) { showToast("Generate a motivation first."); return; }
    if (!("speechSynthesis" in window)) { showToast("Read aloud is not supported in this browser."); return; }
    const utterance = new SpeechSynthesisUtterance(motivation.speech);
    const pet = getAppState().settings?.petAppearance || "dragon";
    utterance.rate = ["turtle", "owl"].includes(pet) ? .82 : ["chicken", "fox"].includes(pet) ? 1.08 : .94;
    utterance.pitch = ["dragon", "wolf"].includes(pet) ? .82 : ["bunny", "chicken"].includes(pet) ? 1.2 : 1;
    speechSynthesis.cancel(); speechSynthesis.speak(utterance);
}
function sendToFocus(task) {
    if (!task) { showToast("Generate a next step first."); return; }
    const app = getAppState(); app.systemTask = task; app.activeTab = "focus";
    localStorage.setItem(APP_KEY, JSON.stringify(app)); location.href = "friction_html.html";
}

function setupBuilderAutocorrect() {
    const toggle = $("#autocorrectToggle");
    if (!toggle) return;
    toggle.checked = store.autocorrectEnabled !== false;
    toggle.addEventListener("change", () => {
        store.autocorrectEnabled = toggle.checked;
        saveStore();
        showToast(toggle.checked ? "Autocorrect is on." : "Autocorrect is off.");
        if (toggle.checked) applyBuilderAutocorrectToAll();
    });
    $$("#builderForm input[type='text'], #builderForm input:not([type]), #builderForm textarea").forEach(field => {
        field.addEventListener("input", () => {
            window.clearTimeout(autocorrectTimers.get(field));
            autocorrectTimers.set(field, window.setTimeout(() => correctBuilderField(field), 700));
        });
        field.addEventListener("blur", () => correctBuilderField(field));
        field.addEventListener("change", () => correctBuilderField(field));
    });
}
function shouldAutocorrect() { return $("#autocorrectToggle")?.checked !== false; }
function applyBuilderAutocorrectToAll() {
    if (!shouldAutocorrect()) return;
    $$("#builderForm input[type='text'], #builderForm input:not([type]), #builderForm textarea").forEach(correctBuilderField);
}
function correctBuilderField(field) {
    if (!shouldAutocorrect() || field.readOnly || field.disabled) return;
    const corrected = autoCorrectText(field.value);
    if (corrected !== field.value) field.value = corrected;
}
function autoCorrectText(text) {
    return String(text || "").replace(/\b[a-z']+\b/gi, word => {
        const lower = word.toLowerCase();
        const replacement = spellingCorrections[lower];
        if (!replacement) return word;
        if (word === word.toUpperCase()) return replacement.toUpperCase();
        if (word[0] === word[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
        return replacement;
    });
}

function openBuilder(systemId = null) {
    const system = typeof systemId === "string" ? findSystem(systemId) : null;
    editingSystemId = system?.id || null;
    builderStep = 0; $("#systemsDashboard").hidden = true; $("#builderForm").hidden = false;
    $("#builderForm").reset(); $("#builderForm [name=weeklyHours]").value = 4;
    $("#autocorrectToggle").checked = store.autocorrectEnabled !== false;
    $("#activateSystemBtn").textContent = editingSystemId ? "Save Changes" : "Activate My System";
    if (system) fillBuilderForm(system);
    showBuilderStep();
}
function closeBuilder() { editingSystemId = null; $("#builderForm").hidden = true; $("#systemsDashboard").hidden = false; $("#activateSystemBtn").textContent = "Activate My System"; }
function fillBuilderForm(system) {
    const form = $("#builderForm");
    const fields = ["name", "category", "goal", "why", "startingPoint", "targetOutcome", "targetDate", "deadlineType", "measure", "weeklyHours", "energyTime", "busyReality", "resources", "gaps", "milestones", "weeklyActions", "nextStep", "fullAction", "reducedAction", "survivalAction", "days", "trigger", "place", "preparation", "environmentRules", "backupPlans", "restartProtocol", "reviewDay"];
    fields.forEach(key => {
        const field = form.elements[key];
        if (!field) return;
        const value = Array.isArray(system[key]) ? system[key].join("\n") : system[key];
        if (value !== undefined && value !== null) field.value = value;
    });
    $$("input[name='obstacles']").forEach(input => {
        input.checked = Array.isArray(system.obstacles) && system.obstacles.includes(input.value);
    });
}
function nextBuilderStep() {
    if (!validateStep()) return;
    if (builderStep < 5) builderStep += 1;
    if (builderStep === 5) renderSummary(); showBuilderStep();
}
function previousBuilderStep() { if (builderStep > 0) builderStep -= 1; showBuilderStep(); }
function validateStep() {
    applyBuilderAutocorrectToAll();
    const invalid = $$(`[data-step="${builderStep}"] [required]`).find(field => !field.value.trim());
    $("#builderError").hidden = !invalid;
    if (invalid) { $("#builderError").textContent = "Finish the highlighted required field before continuing."; invalid.focus(); return false; }
    return true;
}
function showBuilderStep() {
    const titles = ["Define the goal", "Design for reality", "Make the actions concrete", "Build three operating modes", "Plan for friction and recovery", "Check the complete system"];
    $$(".builder-step").forEach(step => step.hidden = Number(step.dataset.step) !== builderStep);
    $$("[data-progress]").forEach(item => { const index = Number(item.dataset.progress); item.classList.toggle("is-active", index === builderStep); item.classList.toggle("is-done", index < builderStep); });
    $("#builderStepTitle").textContent = titles[builderStep]; $("#builderBackBtn").hidden = builderStep === 0;
    $("#builderNextBtn").hidden = builderStep === 5; $("#activateSystemBtn").hidden = builderStep !== 5;
    $("#builderError").hidden = true; window.scrollTo({ top: 0, behavior: "smooth" });
}
function formDataObject() {
    applyBuilderAutocorrectToAll();
    const data = new FormData($("#builderForm")); const result = {};
    for (const [key, value] of data.entries()) key === "obstacles" ? (result.obstacles ||= []).push(value) : result[key] = String(value).trim();
    return result;
}
const lines = value => String(value || "").split("\n").map(item => item.trim()).filter(Boolean);
function renderSummary() {
    const d = formDataObject();
    const actions = lines(d.weeklyActions);
    const milestones = lines(d.milestones);
    const environment = buildEnvironmentPlan(d);
    const recovery = buildRecoveryPlan(d);
    $("#systemSummary").innerHTML = `<div class="summary-grid">
        ${summaryBlock("Plan diagnosis", `<p>${escapeHtml(planDiagnosis(d))}</p><p><strong>Target:</strong> ${d.startingPoint ? `${escapeHtml(d.startingPoint)} to ` : ""}${escapeHtml(d.targetOutcome)}</p>`)}
        ${summaryBlock("Milestone path", listHtml(milestones))}
        ${summaryBlock("Core actions", listHtml(actions))}
        ${summaryBlock("Recommended rhythm", `<p>${escapeHtml(buildRhythm(d, actions))}</p>`)}
        ${summaryBlock("Operating modes", `<strong>Full:</strong> ${escapeHtml(d.fullAction)}<br><strong>Reduced:</strong> ${escapeHtml(d.reducedAction)}<br><strong>Survival:</strong> ${escapeHtml(d.survivalAction)}`)}
        ${summaryBlock("Environment setup", listHtml(environment))}
        ${summaryBlock("Friction guardrails", listHtml(recovery))}
        ${summaryBlock("First move", `<p>${escapeHtml(d.nextStep)}</p><p>${escapeHtml(firstMoveReason(d))}</p>`)}
    </div>`;
}
function summaryBlock(title, content) { return `<article class="summary-block"><h3>${escapeHtml(title)}</h3>${content}</article>`; }
function listHtml(items) { return items.length ? `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "<p>None added.</p>"; }
function planDiagnosis(data) {
    const obstacles = Array.isArray(data.obstacles) ? data.obstacles : [];
    const time = Number(data.weeklyHours) || 1;
    const category = data.category || "Custom goal";
    const why = data.why ? ` It matters because ${data.why}.` : "";
    const risk = obstacles.length
        ? `Main risk: ${obstacles.slice(0, 2).join(" and ").toLowerCase()}.`
        : "Main risk: losing clarity, so the system keeps the next action visible.";
    return `${category}: ${data.goal}. Target: ${data.targetOutcome}.${why} Time budget: about ${time} hour${time === 1 ? "" : "s"} per cycle. ${risk}`;
}
function buildRhythm(data, actions) {
    const time = Number(data.weeklyHours) || 1;
    const sessions = Math.max(1, Math.min(actions.length || 3, Math.ceil(time / 1.5)));
    const minutes = Math.max(15, Math.round((time * 60) / sessions / 5) * 5);
    const days = data.days || "your best available days";
    const trigger = data.trigger ? ` after ${data.trigger}` : "";
    const place = data.place ? ` at ${data.place}` : " in one repeatable work spot";
    const energy = data.energyTime ? ` Your best energy window is ${data.energyTime.toLowerCase()}.` : "";
    const review = data.reviewDay ? ` Review and adjust on ${data.reviewDay}.` : "";
    return `Use ${sessions} focused session${sessions === 1 ? "" : "s"} per planning cycle, about ${minutes} minutes each, on ${days}${trigger}${place}.${energy} Start with the first core action and stop by logging the next smallest step.${review}`;
}
function buildEnvironmentPlan(data) {
    const rules = lines(data.environmentRules);
    const obstacles = Array.isArray(data.obstacles) ? data.obstacles.join(" ").toLowerCase() : "";
    const plan = [...rules];
    if (data.place) plan.unshift(`Use ${data.place} as the default work zone so starting feels familiar.`);
    if (data.preparation) plan.push(`Prepare before starting: ${data.preparation}.`);
    if (data.resources) plan.push(`Keep these resources ready: ${data.resources}.`);
    if (data.gaps) plan.push(`Close this gap early or ask for help: ${data.gaps}.`);
    if (data.busyReality) plan.push(`Plan around this real-life constraint: ${data.busyReality}.`);
    if (/phone|distract/.test(obstacles) && !plan.some(item => /phone|tab|notification/i.test(item))) plan.push("Put the phone away and open only the tabs or materials needed for the next action.");
    if (/environment|schedule|tired/.test(obstacles) && !plan.some(item => /energy|schedule|place|desk|space/i.test(item))) plan.push("Keep one clean, ready work spot with materials already visible.");
    if (!plan.length) plan.push("Before each session, clear the surface, open the needed material, and remove one obvious distraction.");
    return plan;
}
function buildRecoveryPlan(data) {
    const plans = lines(data.backupPlans);
    const obstacles = Array.isArray(data.obstacles) ? data.obstacles.join(" ").toLowerCase() : "";
    const recovery = [...plans];
    if (/large|begin|unrealistic/.test(obstacles)) recovery.push(`When the plan feels too big, switch to Survival Mode: ${data.survivalAction}.`);
    if (/tired|schedule|schoolwork/.test(obstacles)) recovery.push(`On low-energy days, use Reduced Mode instead of skipping: ${data.reducedAction}.`);
    if (/missing|give up|late/.test(obstacles)) recovery.push("After a missed session, do not stack overdue work. Restart with one current action.");
    if (data.deadlineType === "fixed") recovery.push("Because the deadline is fixed, protect the next action before adding extra work.");
    if (data.measure) recovery.push(`Use this progress signal during reviews: ${data.measure}.`);
    if (data.restartProtocol) recovery.push(data.restartProtocol);
    return recovery.length ? recovery : ["If you miss a session, return with Survival Mode, then choose the next current action."];
}
function firstMoveReason(data) {
    return data.why
        ? `This starts the work without needing full motivation, while still pointing back to why it matters: ${data.why}`
        : "This starts the work without waiting for perfect motivation or a perfect schedule.";
}
function activateSystem(event) {
    event.preventDefault(); const data = formDataObject();
    const existing = editingSystemId ? findSystem(editingSystemId) : null;
    const milestones = lines(data.milestones);
    const weeklyActions = lines(data.weeklyActions);
    const system = {
        ...(existing || {}),
        ...data,
        id: existing?.id || String(Date.now()),
        milestones,
        weeklyActions,
        environmentRules: lines(data.environmentRules),
        backupPlans: lines(data.backupPlans),
        completedActions: (existing?.completedActions || []).filter(action => weeklyActions.includes(action)),
        logs: existing?.logs || [],
        currentMode: existing?.currentMode || "Full",
        currentMilestone: milestones.includes(existing?.currentMilestone) ? existing.currentMilestone : (milestones[0] || data.nextStep),
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now()
    };
    if (existing) {
        store.systems = store.systems.map(item => item.id === existing.id ? system : item);
    } else {
        store.systems.unshift(system);
    }
    saveStore(); closeBuilder(); renderDashboard(); showToast(existing ? "System changes saved." : "Your system is active.");
}

function renderDashboard() {
    const list = $("#systemsList");
    if (!store.systems.length) { list.innerHTML = `<article class="empty-system sketch-panel"><img src="friction-logo.svg" alt=""><h3>No active systems yet.</h3><p>Build one goal structure with Full, Reduced, and Survival versions for the life you actually have.</p><button class="sketch-btn primary-btn" data-empty-new type="button">Build Your First System</button></article>`; list.querySelector("[data-empty-new]").addEventListener("click", openBuilder); return; }
    list.innerHTML = store.systems.map(system => {
        normalizeSystem(system);
        const completed = system.logs.filter(log => log.completed).length; const consistency = system.logs.length ? Math.round(completed / system.logs.length * 100) : 0;
        const actionProgress = getCompletedActionCount(system);
        const last = system.logs[0]?.nextAction || system.nextStep;
        return `<article class="system-card sketch-panel"><div><span class="mode-badge">${escapeHtml(system.currentMode)} Mode</span><h3>${escapeHtml(system.name)}</h3><p class="system-goal">${escapeHtml(system.goal)}</p><div class="system-facts"><div class="fact"><span>Target date</span><strong>${formatDate(system.targetDate)}</strong></div><div class="fact"><span>Current milestone</span><strong>${escapeHtml(system.currentMilestone)}</strong></div><div class="fact"><span>Action bank</span><strong>${actionProgress} of ${system.weeklyActions.length} actions completed</strong></div><div class="fact"><span>Consistency</span><strong>${consistency}%</strong></div><div class="fact"><span>Last or next action</span><strong>${escapeHtml(last)}</strong></div></div></div><div class="system-actions"><button class="sketch-btn primary-btn" data-continue="${system.id}" type="button">Continue System</button><button class="sketch-btn quiet-btn" data-review="${system.id}" type="button">Review System</button><button class="sketch-btn peach-btn" data-edit="${system.id}" type="button">Edit System</button><button class="text-btn" data-delete="${system.id}" type="button">Delete System</button></div></article>`;
    }).join("");
}
function handleSystemCardClick(event) {
    const cont = event.target.closest("[data-continue]"); const review = event.target.closest("[data-review]"); const edit = event.target.closest("[data-edit]"); const remove = event.target.closest("[data-delete]");
    if (cont) openDaily(cont.dataset.continue);
    if (review) openReview(review.dataset.review);
    if (edit) openBuilder(edit.dataset.edit);
    if (remove && window.confirm("Delete this system and its check-ins?")) { store.systems = store.systems.filter(system => system.id !== remove.dataset.delete); saveStore(); renderDashboard(); showToast("System deleted."); }
}
function findSystem(id) { return store.systems.find(system => system.id === id); }
function openDaily(id) {
    const system = findSystem(id); if (!system) return; activeSystemId = id; normalizeSystem(system);
    $("#systemsDashboard").hidden = true; const view = $("#dailySystemView"); view.hidden = false; $("#reviewSystemView").hidden = true;
    view.innerHTML = `
        <div class="daily-head">
            <div><p class="scribble-label">Today's System</p><h2>${escapeHtml(system.name)}</h2></div>
            <button class="text-btn" data-back-dashboard type="button">Back to systems</button>
        </div>
        <div class="daily-grid">
            <div class="energy-controls">
                <article class="recommendation-card">
                    <h3>How much do you have today?</h3>
                    <div class="energy-buttons"><button class="sketch-btn" data-mode="Full">Normal</button><button class="sketch-btn" data-mode="Reduced">Low</button><button class="sketch-btn" data-mode="Survival">Barely any</button></div>
                    <p id="modeReason">Choose honestly. The system will adjust the action, not judge the answer.</p>
                </article>
                <article class="recommendation-card">
                    <strong>Current milestone</strong>
                    <p>${escapeHtml(system.currentMilestone)}</p>
                    <button class="sketch-btn quiet-btn" data-advance-milestone type="button">Advance Milestone</button>
                    <strong>Why it matters</strong>
                    <p>${escapeHtml(system.why || system.goal)}</p>
                    <strong>Progress signal</strong>
                    <p>${escapeHtml(system.measure || "Use completed actions and check-ins as the progress signal.")}</p>
                </article>
            </div>
            <article class="today-action">
                <p class="scribble-label" id="todayMode">${escapeHtml(system.currentMode)} Mode</p>
                <h3 id="todayAction">${escapeHtml(actionForMode(system, system.currentMode))}</h3>
                <p>${escapeHtml(system.trigger || "At your chosen start time")} at ${escapeHtml(system.place || "your work space")}.</p>
                <div class="action-checklist">${renderActionChecklist(system)}</div>
                <div class="environment-list">${system.environmentRules.map(rule => `<label><input type="checkbox">${escapeHtml(rule)}</label>`).join("") || "No environment rules added."}</div>
                <button class="sketch-btn primary-btn" data-send-current type="button">Send This Action to Focus</button>
            </article>
        </div>
        <article class="checkin-card">
            <h3>30-second check-in</h3>
            <form class="checkin-form" id="checkinForm">
                <label class="field-block"><span>Did you complete it?</span><select name="completed"><option value="yes">Yes</option><option value="no">No</option></select></label>
                <label class="field-block"><span>Mode used</span><select name="mode"><option>Full</option><option>Reduced</option><option>Survival</option></select></label>
                <label class="field-block"><span>Difficulty</span><select name="difficulty"><option>Easy</option><option selected>Okay</option><option>Hard</option></select></label>
                <label class="field-block"><span>Main friction</span><select name="friction"><option>None</option>${obstacles.map(o => `<option>${escapeHtml(o)}</option>`).join("")}</select></label>
                <label class="field-block wide"><span>Next action</span><input name="nextAction" value="${escapeHtml(system.nextStep)}"></label>
                <button class="sketch-btn green-btn wide" type="submit">Save Check-In</button>
            </form>
        </article>`;
    view.querySelector("[data-back-dashboard]").addEventListener("click", showDashboard);
    view.querySelectorAll("[data-mode]").forEach(btn => btn.addEventListener("click", () => chooseMode(system, btn.dataset.mode)));
    view.querySelector("[data-send-current]").addEventListener("click", () => sendToFocus(actionForMode(system, system.currentMode)));
    view.querySelector("[data-advance-milestone]").addEventListener("click", () => advanceMilestone(system));
    view.querySelector(".action-checklist").addEventListener("change", event => {
        const input = event.target.closest("input[data-action-index]");
        if (input) toggleSystemAction(system, Number(input.dataset.actionIndex), input.checked);
    });
    view.querySelector("#checkinForm").addEventListener("submit", saveCheckin);
}
function normalizeSystem(system) {
    system.milestones = Array.isArray(system.milestones) ? system.milestones : lines(system.milestones);
    system.weeklyActions = Array.isArray(system.weeklyActions) ? system.weeklyActions : lines(system.weeklyActions);
    system.environmentRules = Array.isArray(system.environmentRules) ? system.environmentRules : lines(system.environmentRules);
    system.backupPlans = Array.isArray(system.backupPlans) ? system.backupPlans : lines(system.backupPlans);
    system.completedActions = Array.isArray(system.completedActions) ? system.completedActions.filter(action => system.weeklyActions.includes(action)) : [];
}
function getCompletedActionCount(system) {
    normalizeSystem(system);
    return Math.min(system.completedActions.length, system.weeklyActions.length);
}
function renderActionChecklist(system) {
    normalizeSystem(system);
    if (!system.weeklyActions.length) return "<p>No core actions added.</p>";
    return `<strong>Core actions</strong>${system.weeklyActions.map((action, index) => `<label><input type="checkbox" data-action-index="${index}" ${system.completedActions.includes(action) ? "checked" : ""}>${escapeHtml(action)}</label>`).join("")}`;
}
function toggleSystemAction(system, actionIndex, isDone) {
    const action = system.weeklyActions[actionIndex];
    if (!action) return;
    system.completedActions = isDone
        ? Array.from(new Set([...system.completedActions, action]))
        : system.completedActions.filter(item => item !== action);
    system.updatedAt = Date.now();
    saveStore();
    renderDashboard();
    showToast(isDone ? "Action marked complete." : "Action marked open again.");
}
function advanceMilestone(system) {
    normalizeSystem(system);
    const currentIndex = system.milestones.indexOf(system.currentMilestone);
    const nextMilestone = system.milestones[currentIndex + 1];
    if (!nextMilestone) { showToast("No next milestone yet. Edit the system to add more."); return; }
    system.currentMilestone = nextMilestone;
    system.updatedAt = Date.now();
    saveStore();
    openDaily(system.id);
    showToast("Milestone advanced.");
}
function chooseMode(system, mode) { system.currentMode = mode; saveStore(); $("#todayMode").textContent = `${mode} Mode`; $("#todayAction").textContent = actionForMode(system, mode); $("#modeReason").textContent = mode === "Full" ? "You have enough capacity for meaningful progress." : mode === "Reduced" ? "Keep momentum without exhausting yourself." : "Keep the system alive with the smallest real action."; }
function actionForMode(system, mode) { return mode === "Reduced" ? system.reducedAction : mode === "Survival" ? system.survivalAction : system.fullAction; }
function saveCheckin(event) {
    event.preventDefault(); const system = findSystem(activeSystemId); const data = Object.fromEntries(new FormData(event.target));
    system.logs.unshift({ ...data, completed: data.completed === "yes", at: Date.now() });
    if (!system.logs[0].completed) system.currentMode = "Reduced"; saveStore(); renderDashboard();
    showToast(system.logs[0].completed ? "Check-in saved. Your system learned from today." : missedRecommendation(data.friction)); openDaily(system.id);
}
function missedRecommendation(reason) { if (/phone|distract/i.test(reason)) return "Adjustment: move the phone away before the next Reduced session."; if (/large|begin|unclear/i.test(reason)) return "Adjustment: use Survival Mode and write one exact first action."; return "Adjustment: use Reduced Mode next. Do not stack the missed task."; }
function openReview(id) {
    const system = findSystem(id); if (!system) return; $("#systemsDashboard").hidden = true; $("#dailySystemView").hidden = true;
    const view = $("#reviewSystemView"); view.hidden = false; const logs = system.logs; const done = logs.filter(l => l.completed); const full = done.filter(l => l.mode === "Full").length; const fallback = done.filter(l => l.mode !== "Full").length; const consistency = logs.length ? Math.round(done.length / logs.length * 100) : 0; const common = mostCommon(logs.map(l => l.friction).filter(x => x && x !== "None")) || "No repeated obstacle yet";
    view.innerHTML = `<div class="review-head"><div><p class="scribble-label">System Review</p><h2>${escapeHtml(system.name)}</h2></div><button class="text-btn" data-back-dashboard type="button">Back to systems</button></div><div class="review-grid"><article class="review-block"><span class="metric-number">${consistency}%</span><strong>Action consistency</strong><p>${done.length} completed from ${logs.length} check-ins.</p></article><article class="review-block"><span class="metric-number">${full}</span><strong>Full Mode sessions</strong><p>${fallback} fallback sessions prevented a complete skip.</p></article><article class="review-block"><span class="metric-number">${system.milestones.length}</span><strong>Milestones in the system</strong><p>Current: ${escapeHtml(system.currentMilestone)}</p></article><article class="review-block"><span class="metric-number">${escapeHtml(common)}</span><strong>Most common friction</strong><p>${escapeHtml(reviewAdvice(common, consistency))}</p></article></div><article class="review-block recovery-note"><h3>Recommended adjustment</h3><p>${escapeHtml(reviewAdvice(common, consistency))}</p><button class="sketch-btn primary-btn" data-continue="${system.id}" type="button">Return to Today's Action</button></article>`;
    view.querySelector("[data-back-dashboard]").addEventListener("click", showDashboard); view.querySelector("[data-continue]").addEventListener("click", () => openDaily(id));
}
function reviewAdvice(common, consistency) { if (consistency < 60) return "Reduce the next planning cycle and begin with Reduced Mode. Keep overdue tasks out of the restart."; if (/phone|distract/i.test(common)) return "Add a phone-away trigger before every session."; return "Keep the current workload. Change only the part that repeatedly created friction."; }
function mostCommon(items) { return items.sort((a,b) => items.filter(x => x === b).length - items.filter(x => x === a).length)[0]; }
function showDashboard() { $("#systemsDashboard").hidden = false; $("#builderForm").hidden = true; $("#dailySystemView").hidden = true; $("#reviewSystemView").hidden = true; renderDashboard(); }
function formatDate(value) { if (!value) return "Flexible"; const date = new Date(`${value}T12:00:00`); return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]); }
function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.hidden = false; clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.hidden = true, 3400); }
