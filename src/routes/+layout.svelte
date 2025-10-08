<script lang="ts">
	import '../app.css';
	import NavbarComponent from '$lib/components/Navbar/Navbar.svelte';
	import AppInitializer from '$lib/components/AppInitializer.svelte';
	import HomeDetection from '$lib/components/HomeDetection.svelte';
	import { onMount } from 'svelte';

	// We'll lazy-load non-critical components after first paint / idle to reduce initial bundle and hydration.
	let FooterComponent = $state<any>(null);
	let ScrollToTop = $state<any>(null);
	let ReauthNotification = $state<any>(null);
	let JellyfinReauthNotification = $state<any>(null);
	let SignOutNotification = $state<any>(null);
	let Toast = $state<any>(null);

	function idleImport(fn: () => Promise<any>) {
		if (typeof window === 'undefined') return;
		const rir = (window as any).requestIdleCallback || function (cb: any) { return setTimeout(cb, 200); };
		rir(async () => {
			try {
				await fn();
			} catch (e) {
				// swallow - non-critical
				console.warn('Deferred import failed', e);
			}
		});
	}

	let { children, data } = $props();

	onMount(() => {
		// Defer imports until idle time to avoid blocking initial paint.
		idleImport(async () => {
			FooterComponent = (await import('$lib/components/Navbar/Footer.svelte')).default;
		});

		idleImport(async () => {
			ScrollToTop = (await import('$lib/components/ScrollToTop.svelte')).default;
			Toast = (await import('$lib/components/Toast.svelte')).default;
			ReauthNotification = (await import('$lib/components/Auth/ReauthNotification.svelte')).default;
			JellyfinReauthNotification = (await import('$lib/components/Auth/JellyfinReauthNotification.svelte')).default;
			SignOutNotification = (await import('$lib/components/Auth/SignOutNotification.svelte')).default;
		});
	});
</script>

<HomeDetection />
<AppInitializer />
<NavbarComponent homeData={data.homeData} />
{@render children()}
{#if FooterComponent}
	<FooterComponent />
{/if}

{#if ScrollToTop}
	<ScrollToTop />
{/if}

{#if ReauthNotification}
	<ReauthNotification />
{/if}

{#if JellyfinReauthNotification}
	<JellyfinReauthNotification />
{/if}

{#if SignOutNotification}
	<SignOutNotification />
{/if}

{#if Toast}
	<Toast />
{/if}

