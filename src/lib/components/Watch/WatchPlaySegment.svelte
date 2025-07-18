<!--
@component
WatchPlaySegment – Component to offer "Skip Intro" and "Skip Outro" functionality

Props:
- visible: boolean – Whether the prompt is visible
- segmentType: 'Intro' | 'Outro' – Type of segment to skip
- segmentData: object – Segment data with StartSeconds and EndSeconds
- currentTime: number – Current playback time in seconds
- onSkip: () => void – Callback to skip the segment
- onCancel: () => void – Callback to cancel/dismiss the prompt
-->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { useSettingsStore } from '$lib/stores/settings';

  const isDev = import.meta.env && import.meta.env.DEV;

  export let visible: boolean = false;
  export let segmentType: 'Intro' | 'Outro' = 'Intro';
  export let segmentData: any = null;
  export let onSkip: (() => void) | undefined = undefined;
  export let onCancel: (() => void) | undefined = undefined;

  const dispatch = createEventDispatcher();
  const settingsStore = useSettingsStore();

  let progress = 0;
  let timeRemaining = 7; // Show for 7 seconds by default
  let autoSkipCountdown = 3; // Auto skip countdown (only when auto skip is enabled)
  let autoSkipTriggered = false;
  let countdownInterval: ReturnType<typeof setInterval> | null = null;
  let dismissTimeout: ReturnType<typeof setTimeout> | null = null;

  $: settings = settingsStore.get();
  $: showSkipIntro = settings.displaySkipIntro ?? true;
  $: autoSkipEnabled = settings.autoSkipIntroOutro ?? false;

  // Calculate progress based on time remaining
  $: if (visible && timeRemaining >= 0) {
    progress = ((7 - timeRemaining) / 7) * 100;
  }

  // Start countdown when component becomes visible
  $: if (visible && segmentData && showSkipIntro) {
    startCountdown();
  } else if (!visible) {
    cleanup();
  }

  function startCountdown() {
    cleanup(); // Clear any existing timers
    
    timeRemaining = 7;
    autoSkipCountdown = 3;
    autoSkipTriggered = false;

    // Main countdown timer
    countdownInterval = setInterval(() => {
      timeRemaining--;
      
      // If auto skip is enabled and we're in the last 3 seconds
      if (autoSkipEnabled && timeRemaining <= 3 && timeRemaining > 0) {
        autoSkipCountdown = timeRemaining;
      }
      
      // Auto skip when countdown reaches 0 (if enabled)
      if (autoSkipEnabled && timeRemaining <= 0 && !autoSkipTriggered) {
        autoSkipTriggered = true;
        cleanup();
        
        if (onSkip) {
          onSkip();
        } else {
          dispatch('skip', { segmentData, segmentType });
        }
        return;
      }
      
      // Dismiss when time runs out (if auto skip not enabled)
      if (!autoSkipEnabled && timeRemaining <= 0) {
        handleCancel();
        return;
      }
    }, 1000);

    // Fallback dismiss timeout (safety net)
    dismissTimeout = setTimeout(() => {
      if (!autoSkipTriggered) {
        handleCancel();
      }
    }, 8000);
  }

  function cleanup() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    if (dismissTimeout) {
      clearTimeout(dismissTimeout);
      dismissTimeout = null;
    }
  }

  function handleSkip() {
    if (segmentData && !autoSkipTriggered) {
      autoSkipTriggered = true;
      cleanup();
      
      if (onSkip) {
        onSkip();
      } else {
        dispatch('skip', { segmentData, segmentType });
      }
    }
  }

  function handleCancel() {
    cleanup();
    
    if (onCancel) {
      onCancel();
    } else {
      dispatch('cancel');
    }
  }

  onMount(() => {
    // Component mounted
  });

  onDestroy(() => {
    cleanup();
  });
</script>

{#if visible && segmentData && showSkipIntro}
  <div class="fixed bottom-8 right-8 z-50 bg-base-200/95 backdrop-blur-sm rounded-lg shadow-xl border border-base-300 w-72 overflow-hidden">
    <!-- Progress bar background -->
    <div class="absolute inset-0 bg-base-300/20">
      <div 
        class="h-full bg-base-content/20 transition-all duration-1000 ease-linear"
        style="width: {progress}%"
      ></div>
    </div>
    
    <!-- Content -->
    <div class="relative p-4">
      <div class="flex items-center justify-between mb-3">
        <button
          on:click={handleCancel}
          class="btn btn-ghost btn-xs ml-auto"
          aria-label="Cancel skip segment"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="space-y-2 mb-4">
        <p class="font-medium text-base-content">
          Skip {segmentType}
        </p>
        {#if autoSkipEnabled && timeRemaining <= 3 && timeRemaining > 0}
          <p class="text-sm text-base-content/60">
            Skipping {segmentType.toLowerCase()} in {autoSkipCountdown}s...
          </p>
        {:else if !autoSkipEnabled}
          <p class="text-sm text-base-content/60">
            Dismissing in {timeRemaining}s
          </p>
        {/if}
      </div>
      
      <div class="flex items-center justify-between">
        <span class="text-sm text-base-content/60">
          {#if autoSkipTriggered}
            Skipping...
          {:else if autoSkipEnabled && timeRemaining <= 3}
            Auto-skipping...
          {:else}
            Click to skip
          {/if}
        </span>
        <button
          on:click={handleSkip}
          class="btn btn-primary btn-sm"
          disabled={autoSkipTriggered}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8.689c0-.864.933-1.405 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.405 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z" />
          </svg>
          Skip
        </button>
      </div>
    </div>
  </div>
{/if}
