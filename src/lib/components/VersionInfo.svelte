<!-- Example component showing version info usage -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { getVersionInfo, type VersionInfo } from '$lib/generated/version';
  import { getDeviceProfileHeader } from '$lib/utils/deviceUtils';

  let versionInfo: VersionInfo | null = null;
  let deviceHeader = '';

  onMount(async () => {
    try {
      versionInfo = await getVersionInfo();
      deviceHeader = await getDeviceProfileHeader();
    } catch (error) {
      console.error('Failed to load version or device info:', error);
    }
  });
</script>

{#if versionInfo}
  <div class="version-info card bg-base-200 p-4 my-4 rounded-lg shadow-md">
     <h2 class="card-title text-2xl mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
        </svg>
        App Version
    </h2>
    <p>Version: {versionInfo.version}</p>
    <p>Build Date: {new Date(versionInfo.buildDate).toLocaleString()}</p>
    <p>Build Number: {versionInfo.buildNumber}</p>
    <p>Device Profile: {deviceHeader}</p>
  </div>
{:else}
  <p>Loading version information...</p>
{/if}

<style>
</style>
