<script lang="ts">
  import { onMount } from 'svelte';
  import VersionDisplay from '../VersionDisplay.svelte';
  import { getVersionInfo, type VersionInfo } from '$lib/generated/version';

  let versionInfo: VersionInfo | null = null;
  let appVersion = "N/A";
  let appBuildDate = "N/A";

  onMount(async () => {
    try {
      versionInfo = await getVersionInfo();
      appVersion = versionInfo.version || "N/A";
      appBuildDate = versionInfo.buildDate || "N/A";
    } catch (error) {
      console.error('Failed to load version info:', error);
    }
  });
</script>

<footer class="footer sm:footer-horizontal bg-black text-white p-8 flex flex-col border-base-200 border-t relative z-20">
    <a href="/" class="flex items-center">
        <img src="assets/TRANSPARENT_FAVICON.png" alt="darel's Projects" class="w-12 h-12 rounded-full" />
        <section class="ml-2">
            <h2 class="font-bold text-xl">moNobar</h2>
            <VersionDisplay version={appVersion} buildDate={appBuildDate} />
        </section>
    </a>
    <nav>
        <h6 class="footer-title">External Links</h6>
        <a class="link link-hover" target="_blank" href="https://darelisme.my.id" title="DWS home page">DWS Home</a>
        <a class="link link-hover" target="_blank" href="https://status.darelisme.my.id" title="DWS status page">Status</a>
    </nav>
    <aside>
    </aside>
</footer>