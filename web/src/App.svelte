<script lang="ts">
  import { onMount } from 'svelte';
  import DashboardModule from './modules/dashboard/DashboardModule.svelte';
  import LoginModule from './modules/login/LoginModule.svelte';
  import { getAccessToken } from './lib/auth';

  const LOGIN_ROUTE = '/login';
  const DASHBOARD_ROUTE = '/dashboard';
  const KNOWN_ROUTES = new Set([LOGIN_ROUTE, DASHBOARD_ROUTE]);

  let isAuthenticated = Boolean(getAccessToken());
  let currentPath = '/';

  function navigate(path: string, replace = false) {
    if (window.location.pathname === path) {
      currentPath = path;
      return;
    }

    if (replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }

    currentPath = path;
  }

  function syncRouteWithAuth(replace = true) {
    const isKnownRoute = KNOWN_ROUTES.has(currentPath);

    if (!isKnownRoute) {
      navigate(isAuthenticated ? DASHBOARD_ROUTE : LOGIN_ROUTE, true);
      return;
    }

    if (isAuthenticated && currentPath === LOGIN_ROUTE) {
      navigate(DASHBOARD_ROUTE, replace);
      return;
    }

    if (!isAuthenticated && currentPath === DASHBOARD_ROUTE) {
      navigate(LOGIN_ROUTE, true);
    }
  }

  function syncAuthState() {
    isAuthenticated = Boolean(getAccessToken());
    syncRouteWithAuth(true);
  }

  function handleLoginSuccess() {
    isAuthenticated = true;
    navigate(DASHBOARD_ROUTE);
  }

  function handleLogout() {
    isAuthenticated = false;
    navigate(LOGIN_ROUTE, true);
  }

  onMount(() => {
    const handlePopState = () => {
      currentPath = window.location.pathname;
      syncRouteWithAuth(true);
    };

    currentPath = window.location.pathname;
    syncRouteWithAuth(true);

    window.addEventListener('auth:login', syncAuthState);
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('auth:login', syncAuthState);
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('popstate', handlePopState);
    };
  });
</script>

{#if currentPath === DASHBOARD_ROUTE}
  <DashboardModule />
{:else}
  <LoginModule on:loginSuccess={handleLoginSuccess} />
{/if}
