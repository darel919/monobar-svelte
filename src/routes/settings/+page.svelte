<script>
    import Settings from '$lib/components/Settings.svelte';
  import VersionInfo from '$lib/components/VersionInfo.svelte';
</script>

<svelte:head>
    <title>Settings - Monobar</title>
</svelte:head>

<div class="w-full max-w-6xl mx-auto mt-16 px-8 py-8 min-h-screen">
    <h1 class="text-4xl font-extralight mb-8 text-white">settings</h1>
    
    <Settings />
    <VersionInfo/>
</div>
