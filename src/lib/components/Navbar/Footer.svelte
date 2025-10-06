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
        <section class="">
            <h2 class="font-bold text-xl">moNobar</h2>
            <VersionDisplay version={appVersion} buildDate={appBuildDate} />
        </section>
    </a>
    <nav class="font-light">
      <a href="/changes" title="See app changelog by clicking here." class="link link-hover">changelogs</a>
      <a target="_blank" href="https://github.com/darel919/monobar-svelte/issues/new" title="If you're having problem with anything, please open a new issue on GitHub by clicking here." class="link link-hover">having trouble?</a>
    </nav>
    
    <nav class="font-light">
        <h6 class="footer-title">outside links</h6>
        <a class="link link-hover" target="_blank" href="https://darelisme.my.id" title="DWS home page">at DWS</a>
        <a class="link link-hover" target="_blank" href="https://github.com/darel919/monobar-svelte" title="GitHub Repo of moNobar">GitHub Repository</a>
        <a class="link link-hover" target="_blank" href="https://status.darelisme.my.id/?monitor=dws-monobar" title="DWS status page">Service Status</a>
        
    </nav>
    <aside>
    </aside>
</footer>