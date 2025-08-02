<script lang="ts">
import { onMount } from 'svelte';
import { browser } from '$app/environment';
import { PUBLIC_DARELISME_PING_URL } from '$env/static/public';

const APP_LOCAL_BASE_URL = 'http://monobar.server.drl';

onMount(() => {
    if (!browser) return;
    if (import.meta.env.MODE === 'development') return;
    if (window.location.hostname === 'monobar.server.drl') return;
    async function detectIsHome() {
        try {
            const res = await fetch(PUBLIC_DARELISME_PING_URL, {
                cache: 'no-store',
            });
            if (res.ok) {
                // If ping succeeds, user is NOT at home - stay on current site
                return;
            }
            // If ping fails, user is at home - redirect to local server if on external domain
            localStorage.setItem('redirectAfterSwitch', window.location.pathname + window.location.search);
            window.location.href = APP_LOCAL_BASE_URL + window.location.pathname + window.location.search;
        } catch {
            // If ping fails, user is at home - redirect to local server if on external domain
            localStorage.setItem('redirectAfterSwitch', window.location.pathname + window.location.search);
            window.location.href = APP_LOCAL_BASE_URL + window.location.pathname + window.location.search;
        }
    }
    detectIsHome();
});
</script>
