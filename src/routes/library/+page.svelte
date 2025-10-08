<script context="module">
  // Disable server-side rendering for this route (Client-Side Rendering only)
  export const ssr = false;
</script>

<script>
  import { page } from '$app/stores';
  import { onDestroy } from 'svelte';
  import { LibraryViewDisplay, LibrarySortControl } from '$lib';
  import StopState from '$lib/components/StopState.svelte';
  import ImageComponent from '$lib/components/ImageComponent.svelte';
  import { useSettingsStore } from '$lib/stores/settings';
  import { onMount } from 'svelte';
    
  export let data;

  // We'll fetch serverData on the client since SSR is disabled.
  /** @type {Promise<any> | null} */
  let clientServerDataPromise = null;
  // Abort controller for in-flight client fetches so we can cancel duplicates
  let clientFetchController = null;
  // Remember last endpoint we fetched to avoid refetching the same resource repeatedly
  let lastFetchedEndpoint = null;

  // Build a client-side fetch wrapper to call the same backend endpoints
  // used by server/api.js but from the browser. We rely on the same
  // BASE_API_PATH exposed via env at build time.
  import { BASE_API_PATH } from '$lib/config/api';
  import { getSessionHeaders } from '$lib/utils/authUtils';

  // track the `type` query param reactively so we can refetch when it changes
  /** @type {string | null} */
  let type = null;
  const settingsStore = useSettingsStore();
  const settings = settingsStore.get();

  // we'll subscribe to the `page` store in onMount to detect client navigation changes
  
  // initialize these from passed-in data when available, otherwise we'll read from the URL
  /** @type {string | null} */
  let id = data?.id || null;
  /** @type {string | null} */
  let sortBy = data?.sortBy || null;
  /** @type {string | null} */
  let sortOrder = data?.sortOrder || null;

  let documentTitle = 'Loading Library - Monobar';
  
  // When the provided `data.serverData` is present (from route params), prefer it.
  // Otherwise, fetch on the client using query params from the page url.
  onMount(() => {
    // Ensure id/sortBy/sortOrder/type are populated for controls when not provided by route data
    try {
      const urlObj = new URL(window.location.href);
      id = id || urlObj.searchParams.get('id');
      sortBy = sortBy || urlObj.searchParams.get('sortBy') || (document.cookie.match(/librarySortBy=([^;]+)/)?.[1]) || 'ProductionYear';
      sortOrder = sortOrder || urlObj.searchParams.get('sortOrder') || (document.cookie.match(/librarySortOrder=([^;]+)/)?.[1]) || 'desc';
      type = urlObj.searchParams.get('type') || null;
    } catch (e) {
      // ignore
    }

    // If the server provided a promise (rare when SSR disabled), use it. Otherwise fetch using the initialized params.
    if (data && data.serverData) {
      clientServerDataPromise = data.serverData;
    } else {
      clientServerDataPromise = fetchClientLibraryData();
    }

    // Re-fetch when client-side navigation changes the page store (query params)
    const unsubscribePage = page.subscribe(($p) => {
      try {
        const urlObj = new URL($p.url.href);
        const newId = urlObj.searchParams.get('id') || null;
        const newSortBy = urlObj.searchParams.get('sortBy') || (document.cookie.match(/librarySortBy=([^;]+)/)?.[1]) || 'ProductionYear';
        const newSortOrder = urlObj.searchParams.get('sortOrder') || (document.cookie.match(/librarySortOrder=([^;]+)/)?.[1]) || 'desc';
        const newType = urlObj.searchParams.get('type') || null;

        if (newId !== id || newSortBy !== sortBy || newSortOrder !== sortOrder || newType !== type) {
          id = newId;
          sortBy = newSortBy;
          sortOrder = newSortOrder;
          type = newType;
          console.debug('[library] page store changed, refetching:', { id, sortBy, sortOrder, type });
          clientServerDataPromise = fetchClientLibraryData();
        }
      } catch (e) {
        // ignore
      }
    });

    onDestroy(() => unsubscribePage());
  });

  $: clientServerDataPromise && clientServerDataPromise.then(serverDataResult => {
    const serverData = serverDataResult?.data || null;
    if (serverData) {
      // console.log('Server Data:', serverData);
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

  async function fetchClientLibraryData() {
    try {
      // Prefer module-level values (updated by afterNavigate); fall back to parsing URL
      const urlObj = new URL(window.location.href);
      const idVal = id || urlObj.searchParams.get('id');
      const sortByVal = sortBy || urlObj.searchParams.get('sortBy') || (document.cookie.match(/librarySortBy=([^;]+)/)?.[1]) || 'ProductionYear';
      const sortOrderVal = sortOrder || urlObj.searchParams.get('sortOrder') || (document.cookie.match(/librarySortOrder=([^;]+)/)?.[1]) || 'desc';
      const typeParam = type || urlObj.searchParams.get('type') || null;

      let endpoint = '';
      const params = new URLSearchParams();
      if (idVal) params.append('id', idVal);
      if (sortByVal) params.append('sortBy', sortByVal);
      if (sortOrderVal) params.append('sortOrder', sortOrderVal);

      if (!typeParam) {
        endpoint = `${BASE_API_PATH}/library?${params.toString()}`;
      } else if (typeParam === 'genre') {
        endpoint = `${BASE_API_PATH}/library/genre?${params.toString()}`;
      } else {
        endpoint = `${BASE_API_PATH}/library/type?${params.toString()}`;
      }

      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'dp-Monobar',
        ...getSessionHeaders()
      };

      // If we've already fetched this exact endpoint and have a promise, reuse it
      if (lastFetchedEndpoint === endpoint && clientServerDataPromise) {
        return clientServerDataPromise;
      }

      // Abort any previous in-flight request
      try {
        if (clientFetchController) clientFetchController.abort();
      } catch (e) {
        // ignore
      }
      clientFetchController = new AbortController();

      const resp = await fetch(endpoint, { method: 'GET', headers, signal: clientFetchController.signal });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(JSON.stringify({ status: resp.status, ...err }));
      }
      const json = await resp.json();
      // remember endpoint for deduping
      lastFetchedEndpoint = endpoint;
      // clear controller on success
      clientFetchController = null;
      return { data: json };
    } catch (error) {
      // If the fetch was aborted, return a neutral value instead of an error
      if (error && error.name === 'AbortError') {
        return { data: null, error: null };
      }
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

</script>

<svelte:head>
  <title>{documentTitle}</title>
</svelte:head>

{#await clientServerDataPromise}
  <main class="flex flex-col min-h-screen relative p-8 mt-16">
    <section class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <section class="mb-8">
        <h1 class="text-3xl mb-4 font-extralight">loading library...</h1>
        <!-- <p class="opacity-70">Loading items...</p> -->
         <p class="loading loading-spinner loading-xl"></p>
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
  {@const serverData = serverDataResult?.data || null}

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
              <LibrarySortControl id={id || ''} sortBy={sortBy || ''} sortOrder={sortOrder || ''} />
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
        <LibrarySortControl id={id || ''} sortBy={sortBy || ''} sortOrder={sortOrder || ''} />
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

