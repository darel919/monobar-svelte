<!--
@component
PlayNext – Svelte component to prompt user to play the next episode

Props:
- visible: boolean – Whether the prompt is visible
- secondsRemaining: number – Seconds left in current episode
- nextEpisodeInfo: object – Info about the next episode (id, title, seasonNumber, episodeNumber, seriesId)
- onPlayNext: () => void – Callback to play next episode
- onCancel: () => void – Callback to cancel prompt
- showThreshold: number – When to show the prompt (seconds from end)
- autoProgressThreshold: number – When to auto-progress (seconds from end)
-->

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { useSettingsStore } from '$lib/stores/settings';

  export let visible: boolean = false;
  export let secondsRemaining: number = 0;
  export let nextEpisodeInfo: any = null;
  export let showThreshold: number | null = null;
  export let autoProgressThreshold: number | null = null;

  const dispatch = createEventDispatcher();
  const settingsStore = useSettingsStore();

  let progress = 0;
  let interval: any = null;

  $: actualShowThreshold = showThreshold ?? settingsStore.get().playNextShowThreshold;
  $: actualAutoProgressThreshold = autoProgressThreshold ?? settingsStore.get().playNextAutoProgressThreshold;

  onMount(() => {
    if (!visible) return;
    progress = 0;
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      if (!visible) return;
      progress = Math.min(100, ((actualShowThreshold - secondsRemaining) / (actualShowThreshold - actualAutoProgressThreshold)) * 100);
      if (secondsRemaining <= actualAutoProgressThreshold) {
        dispatch('playNext');
        clearInterval(interval);
      }
    }, 500);
    return () => interval && clearInterval(interval);
  });

  function handlePlayNext() {
    dispatch('playNext');
    if (interval) clearInterval(interval);
  }
  function handleCancel() {
    dispatch('cancel');
    if (interval) clearInterval(interval);
  }
</script>

{#if visible && nextEpisodeInfo}
  <div class="fixed inset-0 flex items-center justify-center z-50 bg-black/60">
    <div class="bg-base-200 rounded-lg shadow-lg p-8 max-w-md w-full flex flex-col items-center">
      <h2 class="text-xl font-bold mb-2">Up Next</h2>
      <div class="mb-4 text-center">
        <span class="font-semibold">{nextEpisodeInfo.title}</span><br />
        <span class="text-xs opacity-70">Season {nextEpisodeInfo.seasonNumber}, Episode {nextEpisodeInfo.episodeNumber}</span>
      </div>
      <div class="w-full bg-base-300 rounded h-2 mb-4">
        <div class="bg-primary h-2 rounded" style="width: {progress}%"></div>
      </div>
      <div class="flex gap-4 w-full justify-center">
        <button class="btn btn-primary" on:click={handlePlayNext}>Play Next</button>
        <button class="btn btn-ghost" on:click={handleCancel}>Cancel</button>
      </div>
      <div class="mt-2 text-xs opacity-60">Automatically playing in {Math.max(0, Math.round(secondsRemaining - actualAutoProgressThreshold))}s...</div>
    </div>
  </div>
{/if}
