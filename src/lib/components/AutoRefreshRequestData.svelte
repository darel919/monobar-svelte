<!--
  AutoRefreshRequestData.svelte
  Auto-refreshing component for request data that fetches and refreshes data every 5 seconds if items are present.
  Props:
    - type: 'movies' | 'shows' — The type of request data to fetch
    - title: string — The section title to display
  Features:
    - Fetches data client-side using browser fetch
    - Auto-refreshes every 5 seconds if data contains items
    - Shows loading state during initial fetch
    - Handles errors gracefully
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import RequestViewDisplay from '$lib/components/RequestViewDisplay.svelte';
  import { PUBLIC_APP_PATH, PUBLIC_DEV_API_BASE_URL } from '$env/static/public';

  export let type: 'movies' | 'shows';
  export let title: string;

  let data: { data?: any[] } | null = null;
  let lastGoodData: { data?: any[] } | null = null;
  let loading = true;
  let error: string | null = null;
  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  const API_BASE = PUBLIC_DEV_API_BASE_URL + PUBLIC_APP_PATH;

  async function fetchRequestData() {
    if (!browser) return;

    try {
      const endpoint = type === 'movies' ? '/request/movies' : '/request/shows';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'dp-Monobar'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      data = { data: result };
      if (result && result.length > 0) {
        lastGoodData = data;
      }
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch data';
      console.error(`Failed to fetch ${type} request data:`, err);
      // Do not update data, keep lastGoodData
    } finally {
      loading = false;
    }
  }

  function startAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    if (data?.data && data.data.length > 0) {
      refreshInterval = setInterval(fetchRequestData, 7000);
    }
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  onMount(() => {
    fetchRequestData();
  });

  onDestroy(() => {
    stopAutoRefresh();
  });

  $: if (data?.data && data.data.length > 0) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
</script>

{#if loading}
  <div class="flex items-center justify-center py-8">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
{:else if error}
  {#if lastGoodData && lastGoodData.data && lastGoodData.data.length > 0}
    <section class="my-4">
      <RequestViewDisplay data={lastGoodData} {title} />
    </section>
  {:else}
    <div class="text-red-500 text-center py-8">
      <p>Error loading {title}: {error}</p>
      <button 
        on:click={fetchRequestData}
        class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Retry
      </button>
    </div>
  {/if}
{:else if data}
 {#if data.data.length > 0}
    <h2 class="text-2xl font-light mb-8"> {title}</h2>
    <section class="my-4">
      <RequestViewDisplay {data} />
    </section>
  {:else}
    <p class="text-center text-gray-500">No {title} request data.</p>
  {/if}
{/if}
