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
  }    
  export let isOpen: boolean = false;
  export let item: LibraryItem | null = null;
  export let mouseX: number = 0;
  export let mouseY: number = 0;
  export let isInPlace: boolean = false;
  export let hoveredItemId: string | null = null;
  const dispatch = createEventDispatcher();

  const MODAL_WIDTH = 300;
  const MODAL_HEIGHT = 100;

  function closeModal() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
  onMount(() => {
    return () => {
      document.removeEventListener('keydown', handleKeydown);
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
{#if isInPlace}  
<div 
    class="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-[9999]"
    style={`width: ${MODAL_WIDTH}px; ${hoveredItemId
      ? (() => {
          const hoveredElement = document.querySelector(`[data-item-id="${hoveredItemId}"]`);
          if (hoveredElement) {
            const rect = hoveredElement.getBoundingClientRect();
            const centerX = rect.left + (rect.width / 2);
            const centerY = rect.top + (rect.height / 2);              
            const modalWidth = MODAL_WIDTH;
            const modalHeight = MODAL_HEIGHT;
            const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
            const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
              let left = Math.max(20, centerX - (modalWidth / 2));
            let top = Math.max(20, centerY - (modalHeight / 2));
            
            if (left + modalWidth > viewportWidth - 20) {
              left = viewportWidth - modalWidth - 20;
            }
            if (top + modalHeight > viewportHeight - 20) {
              top = viewportHeight - modalHeight - 20;
            }
            
            return `position: fixed; left: ${left}px; top: ${top}px;`;
          }
          return `position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);`;
        })()
      : `position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);`
    } pointer-events: auto;`}
    role="document"
    on:mouseenter
    on:mouseleave
    transition:fade
  >
      {#if item}
        <div class="relative w-full h-48 bg-gray-200 dark:bg-gray-700">
          {#if item.posterPath || item.thumbPath || item.ImageTags?.Primary}
            <YtPlayer 
                ytId="dQw4w9WgXcQ"
                mute={false}
                enabled={false}
                loop={false}
                backdrop={item.posterPath || item.thumbPath || item.ImageTags?.Primary}
                on:close={closeModal}
            ></YtPlayer>
          {:else}
            <div class="w-full h-full flex items-center justify-center">
              <span class="text-gray-500 dark:text-gray-400">No Image</span>
            </div>
          {/if}
        </div>
        
        <div class="p-4">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
            {item.OriginalTitle || item.Name || 'Unknown'}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {item.ProductionYear || item.year || 'Unknown Year'} • {item.Type || 'Unknown Type'}
          </p>
          
          <button 
            on:click={() => window.location.href = `/info?id=${item.Id}&type=${item.Type}`}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            View Details
          </button>
        </div>
      {/if}
  </div>
{:else}
<div 
    class="fixed inset-0 z-[9999] pointer-events-none"
    transition:fade
    on:keydown={handleKeydown}
    on:mouseenter
    on:mouseleave
    role="presentation"
  >      
  <div 
      class="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
      style={`width: ${MODAL_WIDTH}px; left: ${(() => {
        const modalWidth = MODAL_WIDTH;
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
        let left = mouseX + 20;        
        if (left + modalWidth > viewportWidth - 20) {
          left = mouseX - modalWidth - 20;
        }        
        return Math.max(20, left);
      })()}px; top: ${(() => {        
        const modalHeight = MODAL_HEIGHT;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
        let top = mouseY + 20;        
        if (top + modalHeight > viewportHeight - 20) {
          top = mouseY - modalHeight - 20;
        }
        return Math.max(20, top);
      })()}px; pointer-events: auto;`}
      role="document"
    >
      {#if item}
        <div class="relative w-full h-48 bg-gray-200 dark:bg-gray-700">
          {#if item.posterPath || item.thumbPath || item.ImageTags?.Primary}
            <YtPlayer 
                ytId="dQw4w9WgXcQ"
                mute={false}
                enabled={false}
                loop={false}
                backdrop={item.posterPath || item.thumbPath || item.ImageTags?.Primary}
                on:close={closeModal}
            ></YtPlayer>
          {:else}
            <div class="w-full h-full flex items-center justify-center">
              <span class="text-gray-500 dark:text-gray-400">No Image</span>
            </div>
          {/if}
        </div>
        
        <div class="p-4">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
            {item.OriginalTitle || item.Name || 'Unknown'}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {item.ProductionYear || item.year || 'Unknown Year'} • {item.Type || 'Unknown Type'}
          </p>
          
          <button 
            on:click={() => window.location.href = `/info?id=${item.Id}&type=${item.Type}`}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            View Details
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
{/if}