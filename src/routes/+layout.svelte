<script lang="ts">
	import '../app.css';
	import NavbarComponent from '$lib/components/Navbar/Navbar.svelte';
	import FooterComponent from '$lib/components/Navbar/Footer.svelte';
	import AppInitializer from '$lib/components/AppInitializer.svelte';
	import ScrollToTop from '$lib/components/ScrollToTop.svelte';
	import ReauthNotification from '$lib/components/Auth/ReauthNotification.svelte';
	import JellyfinReauthNotification from '$lib/components/Auth/JellyfinReauthNotification.svelte';
	import SignOutNotification from '$lib/components/Auth/SignOutNotification.svelte';
	import { authStore } from '$lib/stores/authStore';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import HomeDetection from '$lib/components/HomeDetection.svelte';
	
	let { children, data } = $props();

	onMount(() => {
		let previousAuthState: boolean | null = null;
		
		const unsubscribe = authStore.subscribe(state => {
			if (previousAuthState !== null && previousAuthState !== state.isAuthenticated) {
				setTimeout(() => {
					invalidateAll();
				}, 100);
			}
			previousAuthState = state.isAuthenticated;
		});

		return unsubscribe;
	});
</script>

<HomeDetection />
<AppInitializer />
<NavbarComponent homeData={data.homeData} />
{@render children()}
<FooterComponent/>
<ScrollToTop />
<ReauthNotification />
<JellyfinReauthNotification />
<SignOutNotification />
