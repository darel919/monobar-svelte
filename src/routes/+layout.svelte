<script lang="ts">
	import '../app.css';
	import NavbarComponent from '$lib/components/Navbar.svelte';
	import FooterComponent from '$lib/components/Footer.svelte';
	
	let { children } = $props();
</script>

<NavbarComponent/>
{@render children()}
<FooterComponent/>

<style>
	/* :global(.skeleton) {
		@apply bg-gray-300 animate-pulse;
	} */
	
	:global(.scrollbar-hide) {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	
	:global(.scrollbar-hide::-webkit-scrollbar) {
		display: none;
	}

	/* DaisyUI base fallbacks */
	:global(.bg-base-200) {
		background-color: hsl(var(--b2, 220 13% 91%));
	}
	
	:global(.text-base-content) {
		color: hsl(var(--bc, 220 9% 46%));
	}

	/* Ensure smooth scrolling and backdrop blur support */
	:global(html) {
		scroll-behavior: smooth;
	}
</style>
