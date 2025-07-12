<!--
  RequestViewDisplay.svelte
  Displays a titled section for request data using DaisyUI's list component.
  Props:
    - data: { data?: any[] } — The request data object, expects a 'data' array property.
    - title: string — The section title to display and use in fallback message.
  Renders:
    - For each item in data.data:
        - thumbPath image on the left
        - Series title and season information
        - Progress bar with download percentage
    - Fallback message if no data is available
-->
<script lang="ts">
  import ImageComponent from '$lib/components/ImageComponent.svelte';
  export let data: { data?: any[] };
  export let title: string;

  function getSeasonInfo(item: any): string {
    if (item.episodes && item.episodes.length > 0) {
      const seasons = [...new Set(item.episodes.map((ep: any) => ep.seasonNumber))];
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
</script>

{#if data?.data && data.data.length > 0}
  <main class="mx-auto">
    <h1 class="text-2xl font-light mb-4">{title}</h1>
    <ul class="list bg-base-100 rounded-box shadow-md">
      {#each data.data as item (item.id)}
        <li class="list-row items-center">
          {console.log('Item:', item)}
          <div>
            {#if getImageSrc(item)}
              <img class="h-28 w-18 rounded-sm" src={getImageSrc(item)} alt={item.title || 'Thumbnail'} />
            {:else}
              <div class="h-28 w-18 rounded-sm bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                No Image
              </div>
            {/if}
          </div>
          <div class="flex flex-col justify-between">
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
          
        </li>
      {/each}
    </ul>
  </main>
{:else}
  <p>No {title} data available.</p>
{/if}
