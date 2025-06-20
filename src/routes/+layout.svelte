<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>

{@render children()}

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
</style>
