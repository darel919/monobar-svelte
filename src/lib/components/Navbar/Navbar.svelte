<script lang="ts">    
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { authStore, type UserSession } from '$lib/stores/authStore';
    import SearchBar from './SearchBar.svelte';
    
    let { homeData = [] } = $props();
    let isScrolled = $state(false);
    let isAuthenticated = $state(false);
    let userSession = $state<UserSession | null>(null);

    onMount(() => {
        const handleScroll = () => {
            isScrolled = window.scrollY > 0;
        };

        if (browser) {
            window.addEventListener('scroll', handleScroll);
            
            const unsubscribe = authStore.subscribe(state => {
                isAuthenticated = state.isAuthenticated;
                userSession = state.userSession;
            });
            
            authStore.checkAuthStatus();
            
            return () => {
                window.removeEventListener('scroll', handleScroll);
                unsubscribe();
            };
        }
    });

    function closeDrawer() {
        // console.warn('Closing drawer');
        // Close mobile drawer
        const drawerToggle = document.getElementById('navbar-menu');
        if (drawerToggle) {
            // @ts-ignore
            drawerToggle.checked = false;
        }
        // Close desktop drawer
        const drawerTogglePc = document.getElementById('navbar-menu-pc');
        if (drawerTogglePc) {
            // @ts-ignore
            drawerTogglePc.checked = false;
        }
    }

    function handleLogout() {
        authStore.logout();
        closeDrawer();
    }

    const isWatchMode = $derived(() => $page.url.pathname === '/watch');
</script>

<header class="fixed top-0 left-0 right-0 z-[99] transition-all duration-300 {isScrolled ? 'backdrop-blur-2xl shadow-xl bg-[var(--color-navbar)]' : 'bg-transparent'}">
    {#if !isWatchMode()} 
    <div class="navbar min-h-16 h-full px-2 sm:px-6">
        <!-- Left section -->
        <div class="flex-none flex items-center gap-2">
            <!-- Mobile Drawer: only visible on mobile -->
            <div class="drawer sm:hidden">
                <input id="navbar-menu" type="checkbox" class="drawer-toggle" />
                <div class="drawer-content">
                    <label for="navbar-menu" class="btn btn-color-secondary p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </label>
                </div>
                <!-- Navigation Drawer with homeData (mobile only) -->
                <div class="drawer-side z-[100] left-0">
                    <label for="navbar-menu" aria-label="close sidebar" class="drawer-overlay"></label>              
                    <ul class="menu p-4 w-80 min-h-full bg-base-200">
                        <li>
                            <a 
                                href="/" 
                                class="text-lg {$page.url.pathname === '/' ? 'bg-base-300 font-bold' : ''}"
                                onclick={closeDrawer}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                </svg>

                                home
                            </a>                         
                        </li>
                        {#each homeData as item}
                            <li>                                
                                <a 
                                    href="/library?id={item.Id}" 
                                    class="text-lg {$page.url.pathname === '/library' && $page.url.searchParams.get('id') === item.Id ? 'bg-base-300 font-bold' : ''}"
                                    onclick={closeDrawer}
                                >
                                    {item.Name?.toLowerCase() || ''}
                                </a>
                            </li>
                        {/each}
                        <!-- Requests -->
                        <li>
                            <a 
                                href="/request" 
                                class="text-lg {$page.url.pathname === '/request' ? 'bg-base-300 font-bold' : ''}"
                                onclick={closeDrawer}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                                </svg>
                                requests
                            </a>  
                            <ul>
                                <li>
                                    <a 
                                    href="/request/movies" 
                                    class="text-lg {$page.url.pathname === '/request/movies' ? 'bg-base-300 font-bold' : ''}"
                                    onclick={closeDrawer}
                                    >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0 1 18 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 0 1 6 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                                    </svg>
                                        movies request
                                    </a>   
                                </li>
                               
                            </ul>
                            <ul>
                                <li>
                                    <a 
                                    href="/request/shows" 
                                    class="text-lg {$page.url.pathname === '/request/shows' ? 'bg-base-300 font-bold' : ''}"
                                    onclick={closeDrawer}
                                    >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
                                    </svg>
                                        tv shows request
                                    </a> 
                                </li>
                                 
                            </ul>
                        </li>
                        <div class="divider"></div>
                        <li>                            
                            <a 
                                href="/settings" 
                                class="text-lg {$page.url.pathname === '/settings' ? 'bg-base-300 font-bold' : ''}"
                                onclick={closeDrawer}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.240.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                                settings
                            </a>
                        </li>
                        <!-- Authentication Section -->
                        {#if isAuthenticated}
                            <li>
                                <a 
                                    href="/account" 
                                    class="text-lg overflow-hidden flex flex-row {$page.url.pathname === '/account' ? 'bg-base-300 font-bold' : ''}"
                                    onclick={closeDrawer}
                                >
                                    <img
                                        src={userSession?.user?.user_metadata?.avatar_url || userSession?.user?.user_metadata?.avatar}
                                        alt="User Avatar"
                                        class="h-5 w-5 rounded-full object-cover border border-base-300 shadow-sm hover:opacity-80 transition-opacity duration-150"
                                        referrerpolicy="no-referrer"
                                    />
                                    <p class=" line-clamp-1 w-full">{userSession?.user?.user_metadata.name || userSession?.user?.email || userSession?.user?.user_metadata?.email || 'User'}</p>
                                </a>
                            </li>
                        {:else}
                            <li>
                                <a 
                                    href="/auth/login" 
                                    class="text-lg {$page.url.pathname === '/auth/login' ? 'bg-base-300 font-bold' : ''}"
                                    onclick={closeDrawer}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                                    </svg>
                                    sign in
                                </a>
                            </li>
                        {/if}
                    </ul>
                </div>
            </div>
            <!-- Desktop Drawer: only visible on desktop, no homeData -->
            <div class="drawer hidden sm:block -ml-2">
                <input id="navbar-menu-pc" type="checkbox" class="drawer-toggle" />
                <div class="drawer-content">
                    <label for="navbar-menu-pc" 
                        class="btn custom-navbar-logo border-none hover:opacity-90 transition-colors duration-200"
                    >
                        <img src="/assets/TRANSPARENT_FAVICON.png" alt="Logo" class="h-12 w-full object-contain" />
                    </label>
                </div>
                <!-- Navigation Drawer (desktop, no homeData) -->
                <div class="drawer-side z-[100] left-0">
                    <label for="navbar-menu-pc" aria-label="close sidebar" class="drawer-overlay"></label>
                    <ul class="menu p-4 w-80 min-h-full bg-base-200">
                        <!-- Home -->
                        <li>
                            <a 
                                href="/" 
                                class="text-lg {$page.url.pathname === '/' ? 'bg-base-300 font-bold' : ''}"
                                onclick={closeDrawer}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                </svg>

                                home
                            </a>                         
                        </li>
                        <!-- Requests -->
                        <li>
                            <a 
                                href="/request" 
                                class="text-lg {$page.url.pathname === '/request' ? 'bg-base-300 font-bold' : ''}"
                                onclick={closeDrawer}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                                </svg>
                                requests
                            </a>  
                            <ul>
                                <li>
                                    <a 
                                    href="/request/movies" 
                                    class="text-lg {$page.url.pathname === '/request/movies' ? 'bg-base-300 font-bold' : ''}"
                                    onclick={closeDrawer}
                                    >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0 1 18 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 0 1 6 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
                                    </svg>
                                        movies request
                                    </a>   
                                </li>
                               
                            </ul>
                            <ul>
                                <li>
                                    <a 
                                    href="/request/shows" 
                                    class="text-lg {$page.url.pathname === '/request/shows' ? 'bg-base-300 font-bold' : ''}"
                                    onclick={closeDrawer}
                                    >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
                                    </svg>
                                        tv shows request
                                    </a> 
                                </li>
                                 
                            </ul>
                        </li>
                        <div class="divider"></div>
                        <!-- Settings -->
                        <li>
                            <a 
                                href="/settings" 
                                class="text-lg {$page.url.pathname === '/settings' ? 'bg-base-300 font-bold' : ''}"
                                onclick={closeDrawer}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.240.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                                settings
                            </a>
                        </li>
                        <!-- Profile Section -->
                        {#if isAuthenticated}
                            <li>
                                <a 
                                    href="/account" 
                                    class="text-lg overflow-hidden flex flex-row {$page.url.pathname === '/account' ? 'bg-base-300 font-bold' : ''}"
                                    onclick={closeDrawer}
                                >
                                    <img
                                        src={userSession?.user?.user_metadata?.avatar_url || userSession?.user?.user_metadata?.avatar}
                                        alt="User Avatar"
                                        class="h-5 w-5 rounded-full object-cover border border-base-300 shadow-sm hover:opacity-80 transition-opacity duration-150"
                                        referrerpolicy="no-referrer"
                                    />
                                    <p class=" line-clamp-1 w-full">{userSession?.user?.user_metadata.name || userSession?.user?.email || userSession?.user?.user_metadata?.email || 'User'}</p>
                                </a>
                            </li>
                        {:else}
                            <li>
                                <a 
                                    href="/auth/login" 
                                    class="text-lg {$page.url.pathname === '/auth/login' ? 'bg-base-300 font-bold' : ''}"
                                    onclick={closeDrawer}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                                    </svg>
                                    sign in
                                </a>
                            </li>
                        {/if}
                    </ul>
                </div>
            </div>

        </div>
        <!-- HomeData links: only visible on desktop -->
        <section class="hidden sm:flex gap-8 mx-6 items-center">
            {#each homeData as item}
                <a 
                    href="/library?id={item.Id}" 
                    class="text-lg {$page.url.pathname === '/library' && $page.url.searchParams.get('id') === item.Id ? 'border-b-2 transition-opacity duration-500 font-bold' : ''}"
                >
                    {item.Name?.toLowerCase() || ''}
                </a>
            {/each}
            <a 
                href="/request" 
                class="text-lg {$page.url.pathname === '/request' ? 'border-b-2 transition-opacity duration-500 font-bold' : ''}"
            >
                requests
            </a>
        </section>
        <!-- Center section - Search (responsive, single instance) -->
        <div class="flex-1 flex items-center px-2 sm:px-0 min-w-0 ml-4">
            <div class="flex-grow flex items-center ml-auto min-w-0 max-w-full sm:max-w-[300px]">
                <SearchBar />
            </div>
        </div>
        <!-- Right section - User avatar (always visible, anchored right) -->
        <div class="flex items-center gap-2 min-w-[40px] justify-end ml-auto flex-shrink-0">
            <a href={ isAuthenticated ? "/account" : "/auth/login"} class="focus:outline-none ml-4">
                {#if isAuthenticated && (userSession?.user?.user_metadata?.avatar_url || userSession?.user?.user_metadata?.avatar)}
                    <img
                        src={userSession?.user?.user_metadata?.avatar_url || userSession?.user?.user_metadata?.avatar}
                        alt="User Avatar"
                        class="h-10 w-10 rounded-full object-cover border border-base-300 shadow-sm hover:opacity-80 transition-opacity duration-150"
                        referrerpolicy="no-referrer"
                    />
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-7 w-7 text-base-content/60">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 7.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 19.25a7.75 7.75 0 0 1 15.5 0v.25a.75.75 0 0 1-.75.75h-14a.75.75 0 0 1-.75-.75v-.25Z" />
                    </svg>
                {/if}
            </a>
        </div>
    </div>
    {:else}
    <div class="navbar min-h-16 h-full px-2 sm:px-6">
        <div class="flex-none flex items-center gap-2" title="Exit Playback">
            <a href="/" aria-label="Home" class="btn custom-navbar-logo border-none hover:opacity-90 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
            </a>
        </div>
    </div>
    {/if}
</header>
<style>
    :global(.custom-navbar-logo) {
        background-color: var(--color-base-content) !important;
    }
    :global([data-theme="dark"] .custom-navbar-logo) {
        background-color: transparent !important;
    }
</style>

