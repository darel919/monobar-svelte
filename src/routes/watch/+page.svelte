<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import WatchPlayer from '$lib/components/WatchPlayer.svelte';
import StopState from '$lib/components/StopState.svelte';
import type { SeriesData } from '$lib/utils/episodeUtils';
import { page } from '$app/stores';
import { browser } from '$app/environment';

let watchData: any = null;
let seriesData: SeriesData | null = null;
let fetchError: string | null = null;

let id: string | null = null;
let type: string | null = null;
let seriesId: string | null = null;

let status: string | undefined = undefined;
let error: string | null | undefined = undefined;

$: id = $page.url.searchParams.get('id');
$: type = $page.url.searchParams.get('type');
$: seriesId = $page.url.searchParams.get('seriesId');

if (browser) {
    onDestroy(() => {
        console.warn('Watch page unmounted');
    });
}
</script>

{#if !id || !type}
    <div class="error">Missing id or type</div>
{:else if type !== 'Movie' && type !== 'Episode'}
    <StopState
        message="Invalid type."
        actionDesc="Please recheck the URL."
        action="back"
        actionText="Go back"
    />
{:else if fetchError}
    <div class="error">{fetchError}</div>
{:else if status === 'error' && error}
    <div class="error">{error}</div>
{:else}
    <main class="min-h-screen mt-20">
        <WatchPlayer poster={watchData?.poster} fullData={watchData} id={id} type={type} seriesData={seriesData} />
        <!-- <SeasonsEpisodesViewer seriesData={seriesData} currentEpisodeId={currentEpisodeId} mode="watch" /> -->
    </main>
{/if}
