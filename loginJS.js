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
let authRequestInFlight = false;

bindLoginEvents();
initializeLoginPage();

function bindLoginEvents() {
    elements.authForm.addEventListener("submit", (event) => {
        event.preventDefault();
        signInUser();
    });
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
    if (authRequestInFlight) {
        return;
    }

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

    setAuthLoading(true, "Checking your login...");
    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            updateAuthStatus(formatAuthError(error, "signIn"));
            return;
        }

        window.localStorage.removeItem(OFFLINE_MODE_STORAGE_KEY);
        updateAuthStatus("Signed in. Opening your desk...");
        goToApp();
    } finally {
        setAuthLoading(false);
    }
}

async function signUpUser() {
    if (authRequestInFlight) {
        return;
    }

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

    setAuthLoading(true, "Creating your account...");
    try {
        const redirectUrl = getAuthRedirectUrl();
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectUrl,
                data: {
                    display_name: displayName
                }
            }
        });

        if (error) {
            updateAuthStatus(formatAuthError(error, "signUp"));
            return;
        }

        window.localStorage.removeItem(OFFLINE_MODE_STORAGE_KEY);
        if (!data.session) {
            await resendSignupEmail(email, redirectUrl);
            return;
        }

        updateAuthStatus("Account created. Opening your desk...");
        goToApp();
    } finally {
        setAuthLoading(false);
    }
}

function enterOfflineMode() {
    window.localStorage.setItem(OFFLINE_MODE_STORAGE_KEY, "1");
    goToApp();
}

function updateAuthStatus(message) {
    elements.authStatus.textContent = message;
}

async function resendSignupEmail(email, redirectUrl) {
    const { error } = await supabaseClient.auth.resend({
        type: "signup",
        email,
        options: {
            emailRedirectTo: redirectUrl
        }
    });

    if (error) {
        updateAuthStatus(formatAuthError(error, "resend"));
        return;
    }

    updateAuthStatus("Confirmation email sent. Check your inbox and spam folder, then come back and sign in.");
}

function setAuthLoading(isLoading, message = "") {
    authRequestInFlight = isLoading;
    elements.signInBtn.disabled = isLoading;
    elements.signUpBtn.disabled = isLoading;
    elements.offlineModeBtn.disabled = isLoading;

    if (message) {
        updateAuthStatus(message);
    }
}

function formatAuthError(error, action) {
    const message = `${error?.message || ""}`.toLowerCase();
    const status = error?.status || 0;

    if (message.includes("invalid login credentials")) {
        return "That email and password did not sign in. If you just made this account, verify your email first. If it is already verified, the password is probably wrong.";
    }

    if (message.includes("email not confirmed") || message.includes("email_not_confirmed")) {
        return "This account still needs email verification. Click Create Account to resend the confirmation email.";
    }

    if (message.includes("already registered") || message.includes("user already registered")) {
        return "That email already has an account. Sign in, or use Create Account again to resend the confirmation email if it is not verified yet.";
    }

    if (message.includes("already confirmed") || message.includes("email already confirmed")) {
        return "That email is already verified. Use Sign In with the correct password.";
    }

    if (message.includes("rate limit") || message.includes("too many") || status === 429) {
        return "Supabase is rate-limiting confirmation emails. Wait a minute, then try Create Account again.";
    }

    if (message.includes("redirect") || message.includes("not allowed")) {
        return "The confirmation link URL is not allowed in Supabase yet. Add the GitHub Pages login URL to Supabase Auth redirect URLs.";
    }

    if (action === "resend") {
        return "I could not resend the confirmation email. Wait a minute, check spam, then try again.";
    }

    if (action === "signUp") {
        return "Account creation did not finish. Check the email/password and try again.";
    }

    return error?.message || "Login did not finish. Try again.";
}

function getAuthRedirectUrl() {
    return window.FRICTION_SUPABASE_CONFIG?.emailRedirectTo || new URL("login.html", window.location.href).href;
}

function goToApp() {
    window.location.href = "friction_html.html";
}
