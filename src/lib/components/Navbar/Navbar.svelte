<script>    
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { authStore } from '$lib/stores/authStore';
    import SearchBar from './SearchBar.svelte';
    
    let { homeData = [] } = $props();
    let isScrolled = $state(false);
    let isAuthenticated = $state(false);
    let userSession = $state(null);

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
        console.warn('Closing drawer');
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
</script>

<header class="fixed top-0 left-0 right-0 z-[99] transition-all duration-300 {isScrolled ? 'backdrop-blur-2xl shadow-xl bg-[var(--color-navbar)]' : 'bg-transparent'}">
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
                            <a href="/" class="hidden sm:flex items-center {$page.url.pathname === '/' ? 'bg-base-300 font-bold' : ''}"  onclick={closeDrawer}>
                                <img src="/assets/TRANSPARENT.png" alt="Logo" class="sm:h-10 h-20 w-full object-contain" />
                            </a>                            
                        </li>
                        {#each homeData as item}
                            <li>                                
                                <a 
                                    href="/library?id={item.Id}" 
                                    class="text-lg {$page.url.pathname === '/library' && $page.url.searchParams.get('id') === item.Id ? 'bg-base-300 font-bold' : ''}"
                                    onclick={closeDrawer}
                                >
                                    {item.Name}
                                </a>
                            </li>
                        {/each}
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
                                Settings
                            </a>
                        </li>
                        <!-- Authentication Section -->
                        {#if isAuthenticated}
                            <li>
                                <div class="flex flex-col gap-2 p-2">
                                    <div class="text-sm opacity-70">
                                        Logged in as: {userSession?.user?.email || userSession?.user?.user_metadata?.email || 'User'}
                                    </div>
                                    <button 
                                        class="btn btn-sm btn-outline btn-error"
                                        onclick={handleLogout}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
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
                                    Login
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
                        <li>
                            <a 
                                href="/" 
                                class="text-lg {$page.url.pathname === '/' ? 'bg-base-300 font-bold' : ''}"
                                onclick={closeDrawer}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                </svg>

                                Home
                            </a>                         
                        </li>
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
                                Settings
                            </a>
                        </li>
                        <!-- Authentication Section -->
                        {#if isAuthenticated}
                            <li>
                                <div class="flex flex-col gap-2 p-2">
                                    <div class="text-sm opacity-70">
                                        Logged in as: {userSession?.user?.email || userSession?.user?.user_metadata?.email || 'User'}
                                    </div>
                                    <button 
                                        class="btn btn-sm btn-outline btn-error"
                                        onclick={handleLogout}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
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
                                    Login
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
                    {item.Name}
                </a>
            {/each}
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
                {#if isAuthenticated && userSession?.user.user_metadata.avatar_url}
                    <img
                        src={userSession?.user.user_metadata.avatar_url}
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
</header>
<style>
    :global(.custom-navbar-logo) {
        background-color: var(--color-base-content) !important;
    }
    :global([data-theme="dark"] .custom-navbar-logo) {
        background-color: transparent !important;
    }
    @media (max-width: 767px) {
        .sm\\:flex {
            display: none !important;
        }
        .sm\\:min-w-\[300px\], .sm\\:max-w-\[480px\], .sm\\:w-auto, .sm\\:px-0 {
            min-width: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
        }
    }
</style>

