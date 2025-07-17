<script lang="ts">
	import '../app.css';
	import NavbarComponent from '$lib/components/Navbar/Navbar.svelte';
	import FooterComponent from '$lib/components/Navbar/Footer.svelte';
	import AppInitializer from '$lib/components/AppInitializer.svelte';
	import ScrollToTop from '$lib/components/ScrollToTop.svelte';
	import ReauthNotification from '$lib/components/Auth/ReauthNotification.svelte';
	import JellyfinReauthNotification from '$lib/components/Auth/JellyfinReauthNotification.svelte';
	import SignOutNotification from '$lib/components/Auth/SignOutNotification.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { authStore } from '$lib/stores/authStore';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import HomeDetection from '$lib/components/HomeDetection.svelte';
	
	let { children, data } = $props();

	onMount(() => {
		let previousAuthState: boolean | null = null;
		let lastInvalidation = 0;
		let isHandlingAuthSuccess = false;
		
		const unsubscribe = authStore.subscribe(state => {
			const currentTime = Date.now();
			const hasAuthStateChanged = previousAuthState !== null && previousAuthState !== state.isAuthenticated;
			const timeSinceLastInvalidation = currentTime - lastInvalidation;
			
			// Only handle auth state changes if we're not in the middle of handling auth success
			if (hasAuthStateChanged && timeSinceLastInvalidation > 500 && !isHandlingAuthSuccess) {
				console.log('🔄 Auth state changed, refreshing data...', { 
					from: previousAuthState, 
					to: state.isAuthenticated 
				});
				
				lastInvalidation = currentTime;
				
				setTimeout(() => {
					invalidateAll();
				}, 150);
			}
			
			previousAuthState = state.isAuthenticated;
		});

		// Handle auth success messages from popup
		const handleAuthMessage = async (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;
			
			if (event.data.type === 'AUTH_SUCCESS') {
				console.log('🎯 Received AUTH_SUCCESS message, refreshing auth status...');
				isHandlingAuthSuccess = true;
				
				// Force auth status check and data refresh
				await authStore.checkAuthStatus();
				
				// Give some time for auth state to propagate, then allow normal auth handling
				setTimeout(() => {
					console.log('🔄 Post-auth message data refresh');
					invalidateAll();
					
					// Reset flag after processing
					setTimeout(() => {
						isHandlingAuthSuccess = false;
					}, 1000);
				}, 300);
			}
		};

		window.addEventListener('message', handleAuthMessage);

		return () => {
			unsubscribe();
			window.removeEventListener('message', handleAuthMessage);
		};
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
<Toast />
<Toast />
