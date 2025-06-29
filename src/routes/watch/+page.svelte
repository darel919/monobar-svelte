<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import WatchPlayer from '$lib/components/WatchPlayer.svelte';
import StopState from '$lib/components/StopState.svelte';
import { page } from '$app/stores';
import { browser } from '$app/environment';
import { BASE_API_PATH } from '$lib/config/api';
  import { getAuthorizationHeader, getSessionId } from '$lib/utils/authUtils.js';
export let data;
  
$: watchData = data.serverData.data || null;
$: playUrl = watchData?.playbackUrl || null;

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
{:else}
    <main class="min-h-screen pt-16">
       <section class="relative max-h-screen w-full aspect-video bg-black rounded-lg overflow-hidden my-6">
         <WatchPlayer id={id} poster={watchData?.BackdropImageTags} 
            fullData={watchData} type={type} />
       </section>
    </main>
{/if}
