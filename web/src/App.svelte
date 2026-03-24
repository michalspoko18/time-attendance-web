<script lang="ts">
  import DashboardModule from './modules/dashboard/DashboardModule.svelte';
  import LoginModule from './modules/login/LoginModule.svelte';

  let isAuthenticated = Boolean(localStorage.getItem('accessToken'));

  function handleLoginSuccess() {
    isAuthenticated = true;
  }
</script>

{#if isAuthenticated}
  <DashboardModule />
{:else}
  <LoginModule on:loginSuccess={handleLoginSuccess} />
{/if}
