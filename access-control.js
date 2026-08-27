(function () {
    const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", ""]);
    let serverOwner = null;

    function isLocalPreview() {
        return LOCAL_HOSTS.has(window.location.hostname);
    }

    async function fetchOwnerSession() {
        if (isLocalPreview()) {
            serverOwner = { email: "local-preview", name: "Local Preview" };
            return serverOwner;
        }

        try {
            const response = await fetch("/api/auth/me", {
                credentials: "same-origin",
                headers: { Accept: "application/json" }
            });
            if (!response.ok) {
                serverOwner = null;
                return null;
            }

            const data = await response.json();
            serverOwner = data.authenticated ? data.user : null;
            return serverOwner;
        } catch (error) {
            console.warn("Could not check owner access.", error);
            serverOwner = null;
            return null;
        }
    }

    async function guardHostedPage() {
        if (isLocalPreview()) {
            return true;
        }

        const owner = await fetchOwnerSession();
        if (owner) {
            return true;
        }

        window.location.replace("/index.html");
        return false;
    }

    function hasServerOwnerAccess() {
        return Boolean(serverOwner);
    }

    function getServerOwner() {
        return serverOwner;
    }

    async function signOutOwner() {
        if (!isLocalPreview()) {
            await fetch("/api/auth/signout", {
                method: "POST",
                credentials: "same-origin"
            }).catch(error => console.warn("Could not clear owner session.", error));
        }
        serverOwner = null;
    }

    window.FrictionAccess = {
        isLocalPreview,
        fetchOwnerSession,
        guardHostedPage,
        hasServerOwnerAccess,
        getServerOwner,
        signOutOwner
    };
})();
