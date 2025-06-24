<script>
    import { onMount } from 'svelte';

    let show = $state(false);

    onMount(() => {
        const onScroll = () => show = window.scrollY > 300;
        window.addEventListener('scroll', onScroll);
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    });

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
</script>

{#if show}
    <button
        class="btn btn-circle bg-base-200 fixed bottom-8 right-8 z-50 p-4 shadow-lg text-2xl"
        aria-label="Scroll to top"
        onclick={scrollToTop}
        type="button"
    >
        ⬆️
    </button>
{/if}
