<!--
@component
PlayActionButton Component for initiating playback

Props:
- id: Content ID (required)
- type: Content type (Movie, Series, Episode) (required)  
- playUrl: API endpoint for playback (required)
- seriesData: Series data object with nextUpEpisode info (optional)
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { getAuthorizationHeader, getSessionId } from '$lib/utils/authUtils';
  import { getDeviceProfileHeader } from '$lib/utils/deviceUtils';
  import { BASE_API_PATH } from '$lib/config/api';
  import { getBaseEnvironment } from '$lib/utils/environment';

  const url = window.location.href || null;

  interface NextUpEpisode {
    playUrl?: string;
    Id?: string;
    SeasonName?: string;
    IndexNumber?: number;
  }

  interface SeriesData {
    nextUpEpisode?: NextUpEpisode;
  }

  interface PlaybackData {
    playbackUrl?: string;
    episodeId?: string;
    episodeType?: string;
  }

  export let id: string;
  export let type: string;
  export let playUrl: string;
  export let seriesData: SeriesData | undefined = undefined;

  let isLoading = true;
  let error: string | null = null;
  let playbackData: PlaybackData | null = null;
  let mounted = true;

  onMount(() => {
    if (!browser) return;
    fetchPlaybackData();
  });

  onDestroy(() => {
    mounted = false;
  });

  async function fetchPlaybackData() {
    if (!id || !type || !playUrl) {
      error = 'Missing required parameters';
      isLoading = false;
      return;
    }

    console.log(`PlayActionButton: Fetching playback data for ${type} ${id}`);

    let actualPlayUrl = playUrl;
    let actualId = id;
    let actualType = type;

    if (type === 'Series' && seriesData?.nextUpEpisode?.playUrl) {
      console.log('PlayActionButton: Using next up episode for series playback');
      actualPlayUrl = seriesData.nextUpEpisode.playUrl;
      actualId = seriesData.nextUpEpisode.Id || id;
      actualType = 'Episode';
    }

    try {
      const deviceId = getSessionId();
      if (!deviceId) {
        throw new Error('Device ID not found. Cannot play.');
      }

      const headers: { [key: string]: string } = {
        // "X-Device-Profile": await getDeviceProfileHeader(),
        "X-Session-Id": deviceId,
        "X-Environment": getBaseEnvironment(new URL(url)),
        'Origin': window.location.origin
      };

      const authHeader = getAuthorizationHeader();
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }

      console.log(`PlayActionButton: Making request to ${actualPlayUrl}`);

      const response = await fetch(actualPlayUrl, {
        method: 'GET',
        headers
      });

      if (!mounted) return;

      if (!response.ok) {
        throw new Error(`Failed to start playback: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.playbackUrl) {
        throw new Error('Invalid playback response from server');
      }

      console.log('PlayActionButton: Playback data received successfully');
      playbackData = { ...data, episodeId: actualId, episodeType: actualType };
      error = null;
    } catch (err: any) {
      console.error('PlayActionButton: Error fetching playback data:', err);
      if (mounted) {
        error = err.message;
      }
    } finally {
      if (mounted) {
        isLoading = false;
      }
    }
  }

  function handleCantPlay() {
    alert("Cannot play this title. Please try another title.");
  }

  function handlePlay() {
    console.log(`PlayActionButton: Play button clicked for ${type} ${id}`);
    isLoading = true;

    if (playbackData) {
      if (type === 'Series' && playbackData.episodeId) {
        // Navigate to series episode
        const watchUrl = `/watch?id=${playbackData.episodeId}&type=${playbackData.episodeType}&seriesId=${id}`;
        console.log(`PlayActionButton: Navigating to series episode: ${watchUrl}`);
        goto(watchUrl);
      } else if (type === 'Episode') {
        // Navigate to episode
        const urlParams = new URLSearchParams(window.location.search);
        const currentSeriesId = urlParams.get('seriesId');
        let watchUrl;
        if (currentSeriesId) {
          watchUrl = `/watch?id=${id}&type=${type}&seriesId=${currentSeriesId}`;
        } else {
          watchUrl = `/watch?id=${id}&type=${type}`;
        }
        console.log(`PlayActionButton: Navigating to episode: ${watchUrl}`);
        goto(watchUrl);
      } else {
        // Navigate to regular content
        const watchUrl = `/watch?id=${id}&type=${type}`;
        console.log(`PlayActionButton: Navigating to content: ${watchUrl}`);
        goto(watchUrl);
      }
    } else {
      console.warn('PlayActionButton: No playback data available for play action');
    }
  }

  function getPlayButtonText(): string {
    if (type === 'Series' && seriesData?.nextUpEpisode) {
      const episode = seriesData.nextUpEpisode;
      const seasonName = episode.SeasonName || 'Unknown Season';
      const episodeNumber = episode.IndexNumber;

      if (episodeNumber) {
        return `Play ${seasonName}, Episode ${episodeNumber}`;
      } else {
        return `Play ${seasonName}`;
      }
    }
    return 'Play';
  }
</script>

{#if isLoading}
  <button class="my-4 px-12 btn w-full sm:w-fit btn-disabled">
    <span class="flex items-center gap-2">
      <span class="loading loading-spinner"></span>
      <span>Loading...</span>
    </span>
  </button>
{:else if error || !playbackData}
  <button 
    class="my-4 px-12 btn w-full sm:w-fit btn-error cursor-not-allowed" 
    on:click={handleCantPlay}
  >
    <span class="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <span>Cannot Play</span>
    </span>
  </button>
{:else}
  <button 
    on:click={handlePlay}
    class="my-4 px-12 btn w-full sm:w-fit btn-neutral hover:btn-accent"
  >
    <span class="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
      </svg>
      <span>{getPlayButtonText()}</span>
    </span>
  </button>
{/if}
