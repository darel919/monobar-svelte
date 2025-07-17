<script lang="ts">
    import { toastStore, type ToastMessage } from '$lib/stores/toastStore';
    import { onDestroy } from 'svelte';

    let toasts: ToastMessage[] = [];
    
    const unsubscribe = toastStore.subscribe((value: ToastMessage[]) => {
        toasts = value;
    });

    onDestroy(() => {
        unsubscribe();
    });

    function removeToast(id: string) {
        toastStore.remove(id);
    }

    function getAlertClass(type: string): string {
        switch (type) {
            case 'success': return 'alert-success';
            case 'error': return 'alert-error';
            case 'warning': return 'alert-warning';
            case 'info': return 'alert-info';
            default: return 'alert-info';
        }
    }

    function getIcon(type: string): string {
        switch (type) {
            case 'success': return 'M4.5 12.75l6 6 9-13.5';
            case 'error': return 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z';
            case 'warning': return 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z';
            case 'info': return 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z';
            default: return 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z';
        }
    }
</script>

{#if toasts.length > 0}
    <div class="toast toast-top toast-center z-[200]">
        {#each toasts as toast (toast.id)}
            <div class="alert {getAlertClass(toast.type)} shadow-lg max-w-md">
                <div class="flex items-start gap-3 w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(toast.type)} />
                    </svg>
                    <div class="flex-1 min-w-0">
                        <div class="font-semibold text-sm">{toast.title}</div>
                        {#if toast.message}
                            <div class="text-xs opacity-90 mt-1">{toast.message}</div>
                        {/if}
                    </div>
                    <button 
                        class="btn btn-sm btn-circle btn-ghost opacity-60 hover:opacity-100"
                        on:click={() => removeToast(toast.id)}
                        aria-label="Close notification"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        {/each}
    </div>
{/if}
