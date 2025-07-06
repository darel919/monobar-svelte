<!--
@component
Library Sort Control Component for sorting library items

Props:
- id: Library ID for the sort control
- sortBy: Current sort field from server (includes cookie preferences)
- sortOrder: Current sort order from server (includes cookie preferences)
-->

<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { useSettingsStore } from '$lib/stores/settings';
  import Cookies from 'js-cookie';

  /** @type {string} */
  export let id;
  /** @type {string} */
  export let sortBy;
  /** @type {string} */
  export let sortOrder;

  const sortOptions = [
    { value: "DateCreated", label: "Date Created" },
    { value: "SortName", label: "Sort Name" },
    { value: "ProductionYear", label: "Production Year" },
    { value: "CommunityRating", label: "Community Rating" },
    { value: "Runtime", label: "Runtime" },
    // { value: "Random", label: "Random" },
  ];

  let currentSortBy = sortBy;
  let currentSortOrder = sortOrder;
  let settingsStore = useSettingsStore();
  let isInitializing = true;

  onMount(() => {
    if (browser) {
      isInitializing = false;
    }
  });
  $: if (!isInitializing) {
    currentSortBy = sortBy;
    currentSortOrder = sortOrder;
  }
  $: if (browser && settingsStore && !isInitializing && currentSortBy && currentSortOrder) {
    const settings = settingsStore.get();
    if (currentSortBy !== settings.librarySortBy) {
      settingsStore.setLibrarySortBy(currentSortBy);
      Cookies.set('librarySortBy', currentSortBy, { expires: 365 });
    }
    if (currentSortOrder !== settings.librarySortOrder) {
      settingsStore.setLibrarySortOrder(currentSortOrder);
      Cookies.set('librarySortOrder', currentSortOrder, { expires: 365 });
    }
  }

  /**
   * @param {string} newSortBy
   * @param {string} newSortOrder
   */
  async function handleSortChange(newSortBy, newSortOrder) {
    settingsStore.setLibrarySortBy(newSortBy);
    settingsStore.setLibrarySortOrder(newSortOrder);
    
    if (browser) {
      Cookies.set('librarySortBy', newSortBy, { expires: 365 });
      Cookies.set('librarySortOrder', newSortOrder, { expires: 365 });
    }
    
    const url = new URL($page.url);
    url.searchParams.set("id", id);
    url.searchParams.set("sortBy", newSortBy);
    url.searchParams.set("sortOrder", newSortOrder);
    
    await goto(url.toString());
  }  
  function handleFormChange(/** @type {any} */ event) {
    const target = event.target;
    if (!target || !target.form) return;
    
    const formData = new FormData(target.form);
    const newSortBy = formData.get('sortBy');
    const newSortOrder = formData.get('sortOrder');
    
    if (newSortBy && newSortOrder && typeof newSortBy === 'string' && typeof newSortOrder === 'string') {
      handleSortChange(newSortBy, newSortOrder);
    }
  }
</script>

<form class="flex gap-4" on:change={handleFormChange}>
  <input type="hidden" name="id" value={id} />
  
  <div class="form-control">
    <label class="label" for="sortBy">
      <span class="label-text">Sort By:</span>
    </label>
    <select
      id="sortBy"
      class="select select-bordered rounded-md"
      name="sortBy"
      value={currentSortBy}
    >
      {#each sortOptions as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </div>
  
  <div class="form-control">
    <label class="label" for="sortOrder">
      <span class="label-text">Order:</span>
    </label>
    <select
      id="sortOrder"
      class="select select-bordered rounded-md"
      name="sortOrder"
      value={currentSortOrder}
    >
      <option value="asc">Ascending</option>
      <option value="desc">Descending</option>
    </select>
  </div>
</form>
