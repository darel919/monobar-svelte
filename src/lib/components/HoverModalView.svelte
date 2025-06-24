<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import YtPlayer from './TrailerPlayer.svelte';
  interface LibraryItem {
    Id?: string;
    id?: string;
    Name: string;
    OriginalTitle?: string;
    ProductionYear?: number;
    year?: number;
    Type?: string;
    Overview?: string;
    overview?: string;
    title?: string;
    thumbPath?: string;
    posterPath?: string;
    ImageTags?: {
      Primary?: string;
      Logo?: string;
    };
    RemoteTrailers?: {
      Name: string;
      Url: string;
    }[];
  }
  export let isOpen: boolean = false;
  export let item: LibraryItem | null = null;
  export let modalMode: 'mini' | 'full' = 'mini';
  export let hoveredItemId: string | null = null;
  const dispatch = createEventDispatcher();

  const MODAL_WIDTH = 300;
  const MODAL_HEIGHT = 320;  
  let modalPosition = { left: 0, top: 0, width: 280, height: 157 };
  function updateModalPosition() {
    console.log(item)
    if (hoveredItemId && typeof window !== 'undefined') {
      const hoveredElement = document.querySelector(`[data-item-id="${hoveredItemId}"]`);
      if (hoveredElement) {
        const rect = hoveredElement.getBoundingClientRect();
        
        if (modalMode === 'mini') {
          modalPosition = { 
            left: rect.left, 
            top: rect.top, 
            width: rect.width, 
            height: rect.height 
          };
        } else {
          // NETFLIX STYLE W=32,H199
          const extraWidth = 32;
          const extraHeight = 100;
          modalPosition = { 
            left: rect.left - (extraWidth / 2), 
            top: rect.top - (extraHeight / 2), 
            width: rect.width + extraWidth, 
            height: rect.height + extraHeight 
          };
        }
      }
    }
  }

  $: if (hoveredItemId && typeof window !== 'undefined') {
    updateModalPosition();
  }

  function closeModal() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }  onMount(() => {
    const handleScroll = () => {
      if (isOpen) {
        updateModalPosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updateModalPosition();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  });

  $: {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
    } else {
      document.removeEventListener('keydown', handleKeydown);
    }
  }
</script>

{#if isOpen}  
  <div    
      class="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-[9999]"
      style={`width: ${modalPosition.width}px; height: ${modalPosition.height}px; left: ${modalPosition.left}px; top: ${modalPosition.top}px; pointer-events: auto;`}
      role="document"
      on:mouseenter
      on:mouseleave    
      transition:fade  
  >
    {#if item}
      {#if modalMode === 'mini'}        
      <div class="relative w-full h-full">
          <div class="absolute inset-0">
            <YtPlayer 
              ytId=""
              trailerData={item.RemoteTrailers || []}
              mute={false}
              enabled={false}
              loop={false}
              backdrop={item.posterPath || item.thumbPath || item.ImageTags?.Primary}
              on:close={closeModal}
            />
          </div>
          <div class="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 text-white p-2">
            <h2 class="text-xs font-bold mb-1 truncate text-center">
              {item.OriginalTitle || item.Name || 'Unknown'}
            </h2>
          </div>
        </div>
      {:else}        
      <div class="relative w-full h-full">          
        <div class="absolute inset-0">
            <YtPlayer 
              ytId=""
              trailerData={item.RemoteTrailers || []}
              mute={false}
              enabled={true}
              loop={false}
              backdrop={item.posterPath || item.thumbPath || item.ImageTags?.Primary}
              on:close={closeModal}
            />
          </div>
          <a href={`/info?id=${item.Id}&type=${item.Type}`} class="absolute bottom-0 left-0 right-0 backdrop-blur-3xl text-white px-4 py-2">
            <h2 class="text-md font-bold mb-1 truncate text-left">
              {item.OriginalTitle || item.Name || 'Unknown'}
            </h2>
            <p class="text-sm opacity-90 mb-2 text-left">
              {item.ProductionYear || item.year || 'Unknown Year'} • {item.Type || 'Unknown Type'}
            </p>
          </a>
        </div>
      {/if}      
    {/if}
</div>
{/if}