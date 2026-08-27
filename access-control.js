(function () {
    const OWNER_ACCESS_KEY = "friction-owner-access";
    const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", ""]);

    function isLocalPreview() {
        return LOCAL_HOSTS.has(window.location.hostname);
    }

    function getAllowedEmails() {
        return (window.FRICTION_SUPABASE_CONFIG?.allowedEmails || [])
            .map(email => String(email).trim().toLowerCase())
            .filter(Boolean);
    }

    function isAllowedEmail(email) {
        const allowedEmails = getAllowedEmails();
        return allowedEmails.length > 0 && allowedEmails.includes(String(email || "").trim().toLowerCase());
    }

    function rememberOwnerAccess(email) {
        try {
            window.localStorage.setItem(OWNER_ACCESS_KEY, JSON.stringify({
                email,
                savedAt: Date.now()
            }));
        } catch (error) {
            console.warn("Could not remember owner access locally.", error);
        }
    }

    function forgetOwnerAccess() {
        try {
            window.localStorage.removeItem(OWNER_ACCESS_KEY);
        } catch (error) {
            console.warn("Could not clear owner access locally.", error);
        }
    }

    function hasRememberedOwnerAccess() {
        try {
            const saved = JSON.parse(window.localStorage.getItem(OWNER_ACCESS_KEY) || "null");
            return Boolean(saved?.email && isAllowedEmail(saved.email));
        } catch (error) {
            return false;
        }
    }

    function goToConstruction() {
        if (isLocalPreview()) return;
        window.location.replace("index.html");
    }

    async function guardHostedPage() {
        if (isLocalPreview() || hasRememberedOwnerAccess()) {
            return true;
        }

        const config = window.FRICTION_SUPABASE_CONFIG || {};
        if (!config.url || !config.anonKey || !window.supabase?.createClient) {
            goToConstruction();
            return false;
        }

        const client = window.supabase.createClient(config.url, config.anonKey);
        const { data, error } = await client.auth.getSession();
        if (error || !isAllowedEmail(data.session?.user?.email)) {
            forgetOwnerAccess();
            goToConstruction();
            return false;
        }

        rememberOwnerAccess(data.session.user.email);
        return true;
    }

    window.FrictionAccess = {
        isLocalPreview,
        isAllowedEmail,
        rememberOwnerAccess,
        forgetOwnerAccess,
        hasRememberedOwnerAccess,
        guardHostedPage,
        goToConstruction
    };
})();
