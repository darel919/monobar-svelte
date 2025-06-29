<script lang="ts">
import { onMount, onDestroy } from 'svelte';
// import { playbackStore } from '$lib/stores/playbackStore';
import Settings from '$lib/components/Settings.svelte';
import type { SeriesData } from '$lib/utils/episodeUtils';
import Hls from "hls.js";
import Artplayer from 'artplayer';
import artplayerPluginHls from 'artplayer-plugin-hls-control';

export let poster: string | null = null;
export let fullData: any = null;
export let id: string;
export let type: string;
export let seriesData: SeriesData | null = null;

let artRef: HTMLDivElement | null = null;
let art: Artplayer | null = null;
let showSettings = false;
let unsubscribe: () => void;

function openSettings() {
    showSettings = true;
}
function closeSettings() {
    showSettings = false;
}

function setupPlayer() {
    if (artRef && fullData?.src) {
        if (art) art.destroy();
        art = new Artplayer({
            container: artRef,
            url: fullData.src,
            poster: poster || '',
            autoplay: false,
            isLive: false,
            autoSize: true,
            autoMini: true,
            setting: true,
            playbackRate: true,
            aspectRatio: true,
            fullscreen: true,
            fullscreenWeb: true,
            miniProgressBar: true,
            mutex: true,
            fastForward: true,
            plugins: [artplayerPluginHls({})]
        });
        // art.on('play', () => playbackStore.setActivePlayer(id));
        // art.on('pause', () => playbackStore.setCleanupCallback(() => art?.pause()));
        // art.on('destroy', () => playbackStore.clearActivePlayer(id));
    }
}

// onMount(() => {
//     playbackStore.setActivePlayer(id);
//     unsubscribe = playbackStore.subscribe(() => {});
//     setupPlayer();
//     return () => {
//         playbackStore.clearActivePlayer(id);
//         unsubscribe && unsubscribe();
//         if (art) art.destroy();
//     };
// });
</script>

<div bind:this={artRef} class="player-container w-full h-full relative">
    <button class="btn btn-sm btn-circle btn-ghost absolute top-4 right-4 z-10" on:click={openSettings} aria-label="Player Settings">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
        </svg>
    </button>
    {#if showSettings}
        <div class="modal modal-open">
            <div class="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-lg">Player Settings</h3>
                    <button class="btn btn-sm btn-circle btn-ghost" on:click={closeSettings}>✕</button>
                </div>
                <Settings showBackButton={false} context="player" />
                <div class="modal-action">
                    <button class="btn" on:click={closeSettings}>Close</button>
                </div>
            </div>
        </div>
    {/if}
</div>
