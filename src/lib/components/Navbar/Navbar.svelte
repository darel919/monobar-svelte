<script>    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import SearchBar from './SearchBar.svelte';    let { homeData = [] } = $props();
    let isScrolled = $state(false);onMount(() => {
        const handleScroll = () => {
            isScrolled = window.scrollY > 0;
        };

        if (browser) {
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }
    });

    function closeDrawer() {
        const drawerToggle = /** @type {HTMLInputElement} */ (document.getElementById('navbar-menu'));
        if (drawerToggle) {
            drawerToggle.checked = false;
        }
    }
</script>

<header class="fixed top-0 left-0 right-0 z-[99] transition-all duration-300 {isScrolled ? 'backdrop-blur-2xl shadow-xl' : 'bg-transparent'}">
    <div class="navbar min-h-16 h-full px-2 sm:px-6">
        <!-- Left section -->
        <div class="flex-none flex items-center gap-2">
            <div class="drawer">
                <input id="navbar-menu" type="checkbox" class="drawer-toggle" />
                <div class="drawer-content">
                    <label for="navbar-menu" class="btn btn-color-secondary p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </label>
                </div>
                <!-- Navigation Drawer -->
                <div class="drawer-side z-[100] left-0">
                    <label for="navbar-menu" aria-label="close sidebar" class="drawer-overlay"></label>              
                    <ul class="menu p-4 w-80 min-h-full bg-base-200">
                        <li>
                            <a href="/" class="hidden sm:flex items-center {$page.url.pathname === '/' ? 'bg-base-300 font-bold' : ''}"  onclick={closeDrawer}>
                                <img src="/assets/TRANSPARENT_FAVICON.png" alt="Logo" class="sm:h-10 h-20 sm:w-10 w-20">
                            </a>                            
                            <!-- <a 
                                href="/" 
                                class="text-lg {$page.url.pathname === '/' ? 'bg-base-300 font-bold' : ''}" 
                                onclick={closeDrawer}
                            >
                                Home
                            </a> -->
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
                    </ul>
                </div>
            </div>            

        </div>

        <!-- Center section - Search -->
        <div class="flex-1 px-4 max-w-xl mx-auto">
            <SearchBar />        
        </div>        
    
    </div>
</header>

