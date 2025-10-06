import { writable, type Writable } from 'svelte/store';

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
}

function createToastStore() {
    const { subscribe, update } = writable<ToastMessage[]>([]);

    return {
        subscribe,
        add: (toast: Omit<ToastMessage, 'id'>) => {
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            const duration = toast.duration ?? 5000;
            
            update((toasts: ToastMessage[]) => [...toasts, { ...toast, id }]);
            
            if (duration > 0) {
                setTimeout(() => {
                    update((toasts: ToastMessage[]) => toasts.filter((t: ToastMessage) => t.id !== id));
                }, duration);
            }
        },
        remove: (id: string) => {
            update((toasts: ToastMessage[]) => toasts.filter((t: ToastMessage) => t.id !== id));
        },
        clear: () => {
            update(() => []);
        }
    };
}

export const toastStore = createToastStore();
