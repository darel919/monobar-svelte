<!--
  RequestViewDisplay.svelte
  Displays a titled section for request data using DaisyUI's list component.
  Props:
    - data: { data?: any[] } — The request data object, expects a 'data' array property.
    - title: string — The section title to display and use in fallback message.
    - allowDelete?: boolean — Whether to show delete/cancel buttons for items.
  Renders:
    - For each item in data.data:
        - thumbPath image on the left
        - Series title and season information
        - Progress bar with download percentage
        - Delete/cancel button if allowDelete is true and item can be cancelled
    - Fallback message if no data is available
-->
<script lang="ts">
  import ImageComponent from '$lib/components/ImageComponent.svelte';
  import { toastStore } from '$lib/stores/toastStore';
  import { page } from '$app/stores';
  
  export let data: { data?: any[] | null };
  export let title: string;
  export let allowDelete: boolean = false;

  let isDeleting: { [key: string]: boolean } = {};

  // Delete functions moved from lib/config/api.ts
  async function deleteTVSeries(seriesId: string | number, deleteFiles: boolean = false) {
    try {
        const response = await fetch(`/api/request/shows/delete?id=${encodeURIComponent(seriesId)}&deleteFiles=${deleteFiles}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to delete TV series:', error);
        throw error;
    }
  }

  async function deleteMovie(movieId: string | number, deleteFiles: boolean = false) {
    try {
        const response = await fetch(`/api/request/movies/delete?id=${encodeURIComponent(movieId)}&deleteFiles=${deleteFiles}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to delete movie:', error);
        throw error;
    }
  }

  function getSeasonInfo(item: any): string {
    if (item.episodes && item.episodes.length > 0) {
      const seasons = [...new Set(item.episodes.map((ep: any) => ep.seasonNumber))].filter(s => typeof s === 'number') as number[];
      if (seasons.length === 1) {
        return `Season ${seasons[0]}`;
      } else if (seasons.length > 1) {
        return `Seasons ${Math.min(...seasons)}-${Math.max(...seasons)}`;
      }
    }
    if (item.seasons && item.seasons.length > 0) {
      return `${item.seasons.length} Season${item.seasons.length > 1 ? 's' : ''}`;
    }
    return '';
  }

  function getDownloadPercentage(item: any): number {
    return item.downloadInfo?.percentage ?? item.percentage ?? 0;
  }

  function getImageSrc(item: any): string | null {
    if (!item.images || item.images.length === 0) return null;
    const poster = item.images.find((img: any) => img.coverType === 'poster');
    if (!poster) return null;
    return poster.dwsUrl || poster.remoteUrl || null;
  }

  function canDeleteItem(item: any): boolean {
    // Allow deletion only when item is in waiting list or in progress (not completed)
    return item.status === 'waiting' || item.status === 'inProgress' || item.status === 'requested' || !item.status;
  }

  function isMovieItem(item: any): boolean {
    // Determine if this is a movie based on context or item properties
    return $page.url.pathname.includes('/movies') || item.type === 'movie' || (!item.seasons && !item.episodes);
  }

  async function handleDeleteItem(item: any) {
    if (!item.id && !item.seriesId && !item.movieId) {
      toastStore.add({
        type: 'error',
        title: 'Delete Failed',
        message: 'Cannot delete item: missing ID'
      });
      return;
    }

    const itemId = item.id || item.seriesId || item.movieId;
    isDeleting[itemId] = true;

    try {
      if (isMovieItem(item)) {
        await deleteMovie(itemId, false);
      } else {
        await deleteTVSeries(itemId, false);
      }
      
      toastStore.add({
        type: 'success',
        title: 'Request Cancelled',
        message: `Successfully cancelled request for ${item.title}`
      });

      // Remove item from local data to update UI immediately
      if (data.data) {
        data.data = data.data.filter(dataItem => (dataItem.id || dataItem.seriesId || dataItem.movieId) !== itemId);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      toastStore.add({
        type: 'error',
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to cancel request'
      });
    } finally {
      isDeleting[itemId] = false;
    }
  }
</script>

{#if data?.data && data.data.length > 0}
  <main class="mx-auto">
    <h1 class="text-2xl font-light mb-4">{title}</h1>
    <ul class="list bg-base-100 rounded-box shadow-md">
      {#each data.data as item (item.id || item.seriesId || item.movieId)}
        <li class="list-row items-center">
          <div>
            {#if getImageSrc(item)}
              <img class="h-28 w-18 rounded-sm" src={getImageSrc(item)} alt={item.title || 'Thumbnail'} />
            {:else}
              <div class="h-28 w-18 rounded-sm bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                No Image
              </div>
            {/if}
          </div>
          <div class="flex flex-col justify-between flex-1">
            <section class="">
              <p class="text-2xl font-light">{item.title}</p>
              <div class="text-sm uppercase font-semibold opacity-60">{getSeasonInfo(item)}</div>
            </section>
            {#if item.downloadInfo}
              <section class="my-4">
                <div class="list-col-wrap">
                  <div class="w-full">
                    <div class="flex justify-between text-xs mb-1">
                      <span>Download Progress</span>
                      <span>{getDownloadPercentage(item).toFixed(1)}%</span>
                    </div>
                    <progress class="progress progress-primary w-full h-2" value={getDownloadPercentage(item)} max="100"></progress>
                  </div>
                </div>
              </section>
            {/if}
          </div>
          
          {#if allowDelete && canDeleteItem(item)}
            <div class="flex-shrink-0 ml-4">
              <button 
                class="btn btn-error btn-sm"
                on:click={() => handleDeleteItem(item)}
                disabled={isDeleting[item.id || item.seriesId || item.movieId]}
                title="Cancel Request"
              >
                {#if isDeleting[item.id || item.seriesId || item.movieId]}
                  <span class="loading loading-spinner loading-xs"></span>
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                {/if}
              </button>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  </main>
{:else}
  <p>No {title} data available.</p>
{/if}
