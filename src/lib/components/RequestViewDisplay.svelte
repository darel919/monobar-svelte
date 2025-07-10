<!--
  RequestViewDisplay.svelte
  Displays a titled section for request data in a responsive poster grid, matching LibraryViewDisplay's "poster grid" mode.
  Props:
    - data: { data?: any[] } — The request data object, expects a 'data' array property.
    - title: string — The section title to display and use in fallback message.
  Renders:
    - For each item in data.data:
        - ImageComponent for the first available image (dwsUrl > remoteUrl > fallback)
        - Title and release date (formatted)
    - Fallback message if no data is available
-->
<script lang="ts">
  import ImageComponent from '$lib/components/ImageComponent.svelte';
  export let data: { data?: any[] };
  export let title: string;

  function getImageSrc(images: any[] = []) {
    if (!images || images.length === 0) return null;
    const poster = images.find((img) => img.coverType === 'poster') || images[0];
    return poster.dwsUrl || poster.remoteUrl || null;
  }

  function getImageAlt(item: any) {
    return item.title || title || 'Image';
  }

  function formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
</script>

{#if data?.data && data.data.length > 0}
  <h1 class="text-3xl font-light mb-4">{title}</h1>
  <section class="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-8">
    {#each data.data as item (item.id)}
      <div class="flex flex-col items-center">
        <div class="relative w-full mb-4 aspect-[2/3]">
          {#if getImageSrc(item.images)}
            <ImageComponent
              src={getImageSrc(item.images)}
              alt={getImageAlt(item)}
              showSkeleton={true}
              aspectRatio="2/3"
              borderRadius="rounded-lg"
              fallbackName={item.title}
            />
          {:else}
            <div class="flex items-center justify-center w-full h-full bg-gray-200 rounded-lg text-xs text-gray-500">Not available</div>
          {/if}
        </div>
        <section class="flex flex-col text-center items-center w-full">
          <h2 class="w-full text-lg font-bold truncate">{item.title}</h2>
          {#if item.releaseDate}
            <p class="text-xs opacity-50">{formatDate(item.releaseDate)}</p>
          {/if}
        </section>
      </div>
    {/each}
  </section>
{:else}
  <p>No {title} data available.</p>
{/if}
