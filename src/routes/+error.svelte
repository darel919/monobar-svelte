<script lang="ts">
  export let error;
  export let status;
  import StopState from '$lib/components/StopState.svelte';
</script>

<main class="flex flex-col min-h-screen px-8 pt-20 text-white">
  <!-- {console.log('Error:', error, 'Status:', status)} -->
  <StopState
    message={status === 404 ? 'Page not found.' : 'An error occurred.'}
    actionDesc={error?.message || 'Something went wrong. Please try again later.'}
    action="back"
    actionText="Go Back"
    errorCode={error}
  />
</main>
