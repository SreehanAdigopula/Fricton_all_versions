const OFFLINE_MODE_STORAGE_KEY = "friction-offline-mode";

const elements = {
    authForm: document.getElementById("authForm"),
    authNameInput: document.getElementById("authNameInput"),
    authEmailInput: document.getElementById("authEmailInput"),
    authPasswordInput: document.getElementById("authPasswordInput"),
    authStatus: document.getElementById("authStatus"),
    signInBtn: document.getElementById("signInBtn"),
    signUpBtn: document.getElementById("signUpBtn"),
    offlineModeBtn: document.getElementById("offlineModeBtn")
};

let supabaseClient = null;

bindLoginEvents();
initializeLoginPage();

function bindLoginEvents() {
    elements.authForm.addEventListener("submit", (event) => event.preventDefault());
    elements.signInBtn.addEventListener("click", signInUser);
    elements.signUpBtn.addEventListener("click", signUpUser);
    elements.offlineModeBtn.addEventListener("click", enterOfflineMode);
}

async function initializeLoginPage() {
    const config = window.FRICTION_SUPABASE_CONFIG || {};

    if (!config.url || !config.anonKey) {
        updateAuthStatus("Friction's login database is not available right now. Try Offline Mode or contact the site owner.");
        return;
    }

    if (!window.supabase?.createClient) {
        updateAuthStatus("Could not load the login system. Check your connection and reload.");
        return;
    }

    supabaseClient = window.supabase.createClient(config.url, config.anonKey);
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
        updateAuthStatus(error.message);
        return;
    }

    if (data.session?.user) {
        goToApp();
    } else {
        updateAuthStatus("Sign in or create an account to get started.");
    }
}

async function signInUser() {
    if (!supabaseClient) {
        updateAuthStatus("The login system is still loading. Try again in a moment.");
        return;
    }

    const email = elements.authEmailInput.value.trim();
    const password = elements.authPasswordInput.value;
    if (!email || !password) {
        updateAuthStatus("Enter your email and password to sign in.");
        return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        updateAuthStatus(error.message);
        return;
    }

    window.localStorage.removeItem(OFFLINE_MODE_STORAGE_KEY);
    goToApp();
}

async function signUpUser() {
    if (!supabaseClient) {
        updateAuthStatus("The login system is still loading. Try again in a moment.");
        return;
    }

    const email = elements.authEmailInput.value.trim();
    const password = elements.authPasswordInput.value;
    const displayName = elements.authNameInput.value.trim();
    if (!email || !password) {
        updateAuthStatus("Enter an email and password to create your account.");
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: getAuthRedirectUrl(),
            data: {
                display_name: displayName
            }
        }
    });

    if (error) {
        updateAuthStatus(error.message);
        return;
    }

    window.localStorage.removeItem(OFFLINE_MODE_STORAGE_KEY);
    if (!data.session) {
        updateAuthStatus("Account created. Check your email to confirm it, then sign in.");
        return;
    }

    goToApp();
}

function enterOfflineMode() {
    window.localStorage.setItem(OFFLINE_MODE_STORAGE_KEY, "1");
    goToApp();
}

function updateAuthStatus(message) {
    elements.authStatus.textContent = message;
}

function getAuthRedirectUrl() {
    return new URL("login.html", window.location.href).href;
}

function goToApp() {
    window.location.href = "friction_html.html";
}
