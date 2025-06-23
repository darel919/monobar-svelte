<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    let isScrolled = false;

    onMount(() => {
        const handleScroll = () => {
            isScrolled = window.scrollY > 0;
        };

        if (browser) {
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }
    });
</script>

<header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 {isScrolled ? 'bg-base-100/95 backdrop-blur-sm shadow-xl' : 'bg-transparent'}">
    <a href="/" class="inline-block transition-transform hover:scale-105 active:scale-95 px-5">
        <img src="/assets/TRANSPARENT_FAVICON.png" alt="Logo" class="sm:h-16 h-20 sm:w-16 w-20">
    </a>
</header>