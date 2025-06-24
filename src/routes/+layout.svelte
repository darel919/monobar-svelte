<script lang="ts">
	import '../app.css';
	import NavbarComponent from '$lib/components/Navbar.svelte';
	import FooterComponent from '$lib/components/Footer.svelte';
	import ThemeInitializer from '$lib/components/ThemeInitializer.svelte';
	import ScrollToTop from '$lib/components/ScrollToTop.svelte';
	
	let { children, data } = $props();
</script>

<ThemeInitializer />
<NavbarComponent homeData={data.homeData} />
{@render children()}
<FooterComponent/>
<ScrollToTop />
