<script>
    export let data;
    
    $: serverData = data.serverData;
</script>

<h1>moNobar</h1>

{#if serverData}
    <pre>{JSON.stringify(serverData, null, 2)}</pre>
{/if}

