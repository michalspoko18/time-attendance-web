<script lang="ts">
  import { onMount } from 'svelte';
  import DashboardModule from './modules/dashboard/DashboardModule.svelte';
  import LoginModule from './modules/login/LoginModule.svelte';
  import { getAccessToken } from './lib/auth';

  let isAuthenticated = Boolean(getAccessToken());

  function syncAuthState() {
    isAuthenticated = Boolean(getAccessToken());
  }

  function handleLoginSuccess() {
    isAuthenticated = true;
  }

  function handleLogout() {
    isAuthenticated = false;
  }

  onMount(() => {
    window.addEventListener('auth:login', syncAuthState);
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:login', syncAuthState);
      window.removeEventListener('auth:logout', handleLogout);
    };
  });
</script>

{#if isAuthenticated}
  <DashboardModule />
{:else}
  <LoginModule on:loginSuccess={handleLoginSuccess} />
{/if}
