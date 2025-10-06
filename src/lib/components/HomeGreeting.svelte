<script lang="ts">
import { onMount } from 'svelte';
import { authStore } from '$lib/stores/authStore';

let greeting = 'Hello!';
let opacity = 1;
let timeout1: ReturnType<typeof setTimeout>;
let timeout2: ReturnType<typeof setTimeout>;

// Svelte store subscription
let userSession: any = null;
const unsubscribe = authStore.subscribe(state => {
  userSession = state.userSession;
});

function getGreeting() {
  const currentHour = new Date().getHours();
  let baseGreeting = '';
  if (currentHour < 12) baseGreeting = 'good morning';
  else if (currentHour < 18) baseGreeting = 'good afternoon';
  else baseGreeting = 'good evening';
  const fullName = userSession?.user?.user_metadata?.full_name.toLowerCase();
  return fullName ? `${baseGreeting}, ${fullName.split(' ')[0]}` : baseGreeting;
}

function updateGreeting() {
  const newGreeting = getGreeting();
  opacity = 0;
  timeout2 = setTimeout(() => {
    greeting = newGreeting;
    opacity = 1;
  }, 200);
}

onMount(() => {
  timeout1 = setTimeout(() => {
    updateGreeting();
  }, 1000);
  return () => {
    clearTimeout(timeout1);
    clearTimeout(timeout2);
    unsubscribe();
  };
});

$: if (userSession) {
  updateGreeting();
}
</script>

<div class="text-center sm:text-left my-4 sm:mt-0">
  <h5 
    class="text-lg font-bold transition-opacity duration-400 ease-in-out"
    style="opacity: {opacity}"
  >
    {greeting}
  </h5>
  <p class="text-sm">welcome to moNobar</p>
</div>
