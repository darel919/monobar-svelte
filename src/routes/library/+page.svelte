<script>
  import { page } from '$app/state';
  import { LibraryViewDisplay, LibrarySortControl } from '$lib';
  import StopState from '$lib/components/StopState.svelte';
  import ImageComponent from '$lib/components/ImageComponent.svelte';
  import { useSettingsStore } from '$lib/stores/settings';
  import { onMount } from 'svelte';
    
  export let data;

  const type = page.url.searchParams.get('type') || null;
  const settingsStore = useSettingsStore();
  const settings = settingsStore.get();
  
  $: id = data.id;
  $: sortBy = data.sortBy;
  $: sortOrder = data.sortOrder;

  let documentTitle = 'Loading Library - Monobar';
  
  $: data.serverData.then(serverDataResult => {
    const serverData = serverDataResult.data || null;
    if (serverData) {
      if (type === 'genre' && serverData.Name) {
        documentTitle = `Genre: ${serverData.Name} - moNobar`;
      } else if (serverData.library?.Name) {
        documentTitle = `${serverData.library.Name} - moNobar`;
      } else {
        documentTitle = 'Library - Monobar';
      }
    } else {
      documentTitle = 'Library - Monobar';
    }
  }).catch(() => {
    documentTitle = 'Error - Monobar';
  });

</script>

<svelte:head>
  <title>{documentTitle}</title>
</svelte:head>

{#await data.serverData}
  <main class="flex flex-col min-h-screen relative p-8 mt-16">
    <section class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <section class="mb-8">
        <h1 class="text-4xl mb-4 font-extralight">movies</h1>
        <p class="opacity-70">Loading items...</p>
      </section>
    </section>
    <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mt-2">
      {#each Array(18) as _, i}
        <div class="animate-pulse flex flex-col items-center">
          <div class="relative w-full aspect-[16/9] bg-base-300 rounded-sm"></div>
        </div>
      {/each}
    </section>
  </main>
{:then serverDataResult}
  {@const serverData = serverDataResult.data || null}

  {#if type === 'genre'}
  <main class="flex flex-col min-h-screen relative pt-16">
      {#if serverData && serverData.content}          
      <!-- Banner Image Background -->
          <div class="absolute top-0 left-0 right-0 bottom-0 min-h-full transition-fade-in duration-500">
              <ImageComponent
                  src={serverData.bannerPath}
                  alt={serverData.Name}
                  loading="eager"
                  containerClass="w-full h-full"
                  imageClass="object-cover pointer-events-none opacity-70"
                  borderRadius="rounded-none"
                  showSkeleton={false}
                  fallbackName={serverData.Name || 'Library'}
              />
              <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-base-100"></div>
          </div>
          
          <!-- Content -->
          <div class="relative z-10 p-8 pt-4 transition-fade-in duration-200">            
              <!-- Genre Title -->
               <section class="flex flex-row justify-between items-center">
                  <section class="mb-8 py-8">
                      <h1 class="text-5xl font-extralight mb-4 text-white drop-shadow-lg">{serverData.SortName}</h1>
                      <p>{serverData.content.length} items.</p>
                  </section>
                  <!-- Sort Control -->
                  {#if id}
                      <section class="mb-6">
                          <LibrarySortControl {id} {sortBy} {sortOrder} />
                      </section>
                  {/if}
               </section>
              
              {#if serverData.content.length > 0}
              <section>
                  <LibraryViewDisplay data={serverData.content} viewMode="default_thumb_library" />
              </section>
              {:else}
              <StopState
                  action="reload"
                  message="No content available"
                  actionDesc="This library has no content available."
                  actionText="Reload">
              </StopState>
          {/if}
          </div>
          {:else} 
          <StopState
              action="reload"
              message="Library unavailable"
              actionDesc="This library is unavailable. Please try another library."
              actionText="Reload">
          </StopState>
      {/if}

  </main>
  {:else}
  <main class="flex flex-col min-h-screen relative p-8 mt-16">
      {#if serverData && serverData.content}        
          {#if serverData.library && serverData.library.Name} 
              <section class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <section class="mb-8">
                      <h1 class="text-4xl mb-4 font-extralight">{serverData.library.Name.toLowerCase()}</h1>
                      <p>{serverData.content.length} items.</p>
                  </section>
                  {#if id}
                      <section class="mb-12 sm:mb-6">
                          <LibrarySortControl {id} {sortBy} {sortOrder} />
                      </section>
                  {/if}
              </section>
          {/if}
          
          {#if serverData.content.length > 0}
              <section>
                  <LibraryViewDisplay data={serverData.content} viewMode="default_thumb_library" />
              </section>
          {:else}
              <StopState
                  action="reload"
                  message="No content available"
                  actionDesc="This library has no content available."
                  actionText="Reload">
              </StopState>
          {/if}
          {:else} 
          <StopState
              action="reload"
              message="Library unavailable"
              actionDesc="This library is unavailable. Please try another library."
              actionText="Reload">
          </StopState>
      {/if}

  </main>
  {/if}
{:catch error}
  <main class="flex flex-col min-h-screen relative p-8 mt-16">
      <StopState
          action="reload"
          message="Failed to load library"
          actionDesc="There was an error loading the library data. Please try again."
          actionText="Reload">
      </StopState>
  </main>
{/await}

