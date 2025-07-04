<!--
@component
PlayNext – Svelte component to prompt user to play the next episode

Props:
- visible: boolean – Whether the prompt is visible
- secondsRemaining: number – Seconds left in current episode (initial value)
- nextEpisodeInfo: object – Info about the next episode (id, title, seasonNumber, episodeNumber, seriesId)
- onPlayNext: () => void – Callback to play next episode
- onCancel: () => void – Callback to cancel prompt
- showThreshold: number – When to show the prompt (seconds from end)
- autoProgressThreshold: number – When to auto-progress (seconds from end)
-->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { useSettingsStore } from '$lib/stores/settings';

  export let visible: boolean = false;
  export let secondsRemaining: number = 0;
  export let nextEpisodeInfo: any = null;
  export let showThreshold: number | null = null;
  export let autoProgressThreshold: number | null = null;

  const dispatch = createEventDispatcher();
  const settingsStore = useSettingsStore();

  let progress = 0;
  let autoProgressTriggered = false;

  $: actualShowThreshold = showThreshold ?? settingsStore.get().playNextShowThreshold;
  $: actualAutoProgressThreshold = autoProgressThreshold ?? settingsStore.get().playNextAutoProgressThreshold;

  // Use the actual secondsRemaining from the player instead of maintaining our own timer
  $: if (visible && nextEpisodeInfo && secondsRemaining > 0) {
    const timeIntoPrompt = actualShowThreshold - secondsRemaining;
    const totalPromptTime = actualShowThreshold - actualAutoProgressThreshold;
    progress = Math.min(100, Math.max(0, (timeIntoPrompt / totalPromptTime) * 100));
  }

  // Check for auto-progress based on player's remaining time
  $: if (visible && nextEpisodeInfo && nextEpisodeInfo.id && secondsRemaining <= actualAutoProgressThreshold && secondsRemaining > 0 && !autoProgressTriggered) {
    autoProgressTriggered = true;
    dispatch('playNext');
  }

  // Reset when component becomes visible or invisible
  $: if (visible && nextEpisodeInfo && nextEpisodeInfo.id) {
    autoProgressTriggered = false;
  } else if (!visible) {
    autoProgressTriggered = false;
    progress = 0;
  }

  function stopProgressTracking() {
    // No longer needed - we don't maintain our own timer
  }

  function handlePlayNext() {
    if (!autoProgressTriggered) {
      autoProgressTriggered = true;
      dispatch('playNext');
    }
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

{#if visible && nextEpisodeInfo && nextEpisodeInfo.id}
  <div class="fixed bottom-8 right-8 z-50 bg-base-200/95 backdrop-blur-sm rounded-lg shadow-xl border border-base-300 w-80 overflow-hidden">
    <!-- Progress bar background -->
    <div class="absolute inset-0 bg-primary/20">
      <div 
        class="h-full bg-primary/40 transition-all duration-1000 ease-linear"
        style="width: {progress}%"
      ></div>
    </div>
    
    <!-- Content -->
    <div class="relative p-4">
      <div class="flex items-center justify-between mb-3">
        <button
          on:click={handleCancel}
          class="btn btn-ghost btn-xs ml-auto"
          aria-label="Cancel auto play"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="space-y-2 mb-4">
        <p class="text-sm text-base-content/80">
          Season {nextEpisodeInfo.seasonNumber} • Episode {nextEpisodeInfo.episodeNumber}
        </p>
        <p class="font-medium text-base-content line-clamp-2">
          {nextEpisodeInfo.title}
        </p>
      </div>
      
      <div class="flex items-center justify-between">
        <span class="text-sm text-base-content/60">
          {autoProgressTriggered ? 'Loading next episode...' : secondsRemaining <= actualAutoProgressThreshold ? 'Loading next episode...' : `Playing next episode in ${Math.round(secondsRemaining)}s`}
        </span>
        <button
          on:click={handlePlayNext}
          class="btn btn-primary btn-sm"
          disabled={autoProgressTriggered}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
          </svg>
          Play Now
        </button>
      </div>
    </div>
  </div>
{/if}
