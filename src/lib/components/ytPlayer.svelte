<script lang="ts">
    export let ytId: string = '';
    export let mute: boolean = true;
</script>

<div class="w-full h-full relative">
    {#if ytId}
        <iframe
            class="w-full h-full border-0"
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=${mute ? 1 : 0}&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0&fs=0&iv_load_policy=3&loop=1&playlist=${ytId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            title="YouTube video player"
        ></iframe>
    {/if}
</div>