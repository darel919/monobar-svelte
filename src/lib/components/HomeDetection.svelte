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
            if (res.ok) return;
            localStorage.setItem('redirectAfterSwitch', window.location.pathname + window.location.search);
            window.location.href = APP_LOCAL_BASE_URL + window.location.pathname + window.location.search;
        } catch {
            localStorage.setItem('redirectAfterSwitch', window.location.pathname + window.location.search);
            window.location.href = APP_LOCAL_BASE_URL + window.location.pathname + window.location.search;
        }
    }
    detectIsHome();
});
</script>
