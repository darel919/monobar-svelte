<script lang="ts">
  export let version: string;
  export let buildDate: string;

  $: displayComponent = version && version !== "N/A";

  let formattedDate = "Invalid Date";
  
  $: {
    if (buildDate && buildDate !== "N/A") {
      try {
        const dateObject = new Date(buildDate);
        if (!isNaN(dateObject.getTime())) {
          formattedDate = dateObject.toLocaleString();
        } else {
          formattedDate = buildDate;
        }
      } catch (e) {
        formattedDate = buildDate;
      }
    } else if (buildDate === "N/A") {
      formattedDate = "N/A";
    }
  }
</script>

{#if displayComponent}
  <div class="text-xs opacity-35 font-mono">
    <p>Version: {version}</p>
    <p>Build: {formattedDate}</p>
  </div>
{/if}
