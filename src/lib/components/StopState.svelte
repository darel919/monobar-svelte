<!--
@component
Stop State Component for displaying error messages and action buttons

Props:
- message: Main error or information message to display (required)
- actionText: Text for the action button (defaults to "Return to Home")
- actionDesc: Optional description text below the action button (defaults to undefined)
- action: Action to perform - 'reload', 'home', 'back', or custom route path (defaults to "home")
- errorCode: Optional error code to display (defaults to null)

-->

<script>
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	export let message;
	export let actionText = "Return to Home";
	export let actionDesc = undefined;
	export let action = "home";
	export let errorCode = null;

	function handleAction() {
		switch (action) {
			case 'reload':
				if (browser) {
					window.location.reload();
				}
				break;
			case 'home':
				goto('/');
				break;
			case 'back':
				if (browser) {
					window.history.back();
				}
				break;
			default:
				if (action.startsWith('/')) {
					goto(action);
				} else {
					goto('/');
				}
		}
	}
</script>

<section class="flex min-h-screen flex-col items-center justify-center px-4 sm:px-12">
	<div class="flex-row sm:flex items-center mb-4">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="stroke-current shrink-0 h-10 sm:h-12 w-10 sm:w-12"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<div class="flex flex-col ml-0 sm:ml-4">
			<span class="my-4 sm:my-0 font-light text-4xl">{message}</span>
			{#if actionDesc}
				<p class="mt-2 text-md">{actionDesc}</p>
			{/if}
			{#if errorCode}
				<p class="mt-2 text-sm text-red-500">Stop reason: <b>{errorCode}</b></p>
			{/if}
		</div>
	</div>
	<button
		on:click={handleAction}
		class="btn text-[var(--color-text)] btn-primary hover:bg-base-200 rounded-4xl p-4 mt-4 sm:mt-6"
	>
		{actionText}
	</button>
</section>