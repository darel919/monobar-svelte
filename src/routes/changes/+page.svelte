<script>
import { onMount } from 'svelte';
import { getVersionInfo } from '$lib/generated/version';

export let data;
$: ({ changes = [], error } = data);

let currentVersion = '';
$: newestVersion = changes.length > 0 ? changes[0].version : null;

onMount(async () => {
  try {
    const versionInfo = await getVersionInfo();
    currentVersion = versionInfo.version.replace(/^[a-zA-Z]+-/, '');
  } catch (error) {
    console.error('Failed to load version info:', error);
  }
});
</script>

<section class="max-w-3xl mx-auto pt-20 min-h-screen sm:px-4 px-0">
  <h1 class="text-2xl font-bold mb-6">Changelog</h1>
  {#if error}
    <div class="text-red-500 mb-4">{error}</div>
  {/if}
  {#if changes.length === 0 && !error}
    <div class="text-gray-500">No changelog data available.</div>
  {:else if changes.length > 0}
    <ul class="space-y-8">
      {#each changes as change (change.sha_id + change.date)}
        <li class="border-b pb-4">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-lg">{change.version}</span>
              {#if change.version === newestVersion}
                <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Newest</span>
              {/if}
              {#if change.version === currentVersion}
                <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Current Version</span>
              {/if}
            </div>
            <span class="text-xs text-gray-400">{new Date(change.date).toLocaleString()}</span>
          </div>
          <ul class="list-disc ml-6 text-sm">
            {#each change.changes as entry}
              <li>{entry.message}</li>
            {/each}
          </ul>
          <a href={`https://github.com/darel919/monobar-svelte/commit/${change.sha_id}`} target="_blank" class="mt-2 text-xs text-gray-400">
            Commit: <span class="font-mono">{change.sha_id}

            </span>
        </a>
        </li>
      {/each}
    </ul>
  {/if}
</section>
