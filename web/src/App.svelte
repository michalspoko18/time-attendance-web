<script lang="ts">
  import { onMount } from 'svelte';
  import DashboardModule from './modules/dashboard/DashboardModule.svelte';
  import LoginModule from './modules/login/LoginModule.svelte';
  import ManagerLayout from './modules/manager/ManagerLayout.svelte';
  import { api } from './lib/api';
  import { getAccessToken } from './lib/auth';

  const LOGIN_ROUTE = '/login';
  const DASHBOARD_ROUTE = '/dashboard';
  const MANAGER_ROUTES_PREFIX = '/manager';

  let isAuthenticated = Boolean(getAccessToken());
  let isManager = false;
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

  function defaultAuthRoute() {
    return isManager ? '/manager/dashboard' : DASHBOARD_ROUTE;
  }

  function syncRouteWithAuth(replace = true) {
    const isManagerRoute = currentPath.startsWith(MANAGER_ROUTES_PREFIX);
    const isKnownPublicRoute = currentPath === LOGIN_ROUTE || currentPath === DASHBOARD_ROUTE;

    if (!isAuthenticated) {
      if (currentPath !== LOGIN_ROUTE) {
        navigate(LOGIN_ROUTE, true);
      }
      return;
    }

    if (currentPath === LOGIN_ROUTE) {
      navigate(defaultAuthRoute(), replace);
      return;
    }

    if (isManagerRoute && !isManager) {
      navigate(DASHBOARD_ROUTE, true);
      return;
    }

    if (!isKnownPublicRoute && !isManagerRoute) {
      navigate(defaultAuthRoute(), true);
    }
  }

  async function fetchMe() {
    try {
      const response = await api.get('/api/auth/me/');
      isManager = response.data?.is_manager ?? false;
    } catch {
      isManager = false;
    }
  }

  function syncAuthState() {
    isAuthenticated = Boolean(getAccessToken());
    if (isAuthenticated) {
      fetchMe().then(() => syncRouteWithAuth(true));
    } else {
      isManager = false;
      syncRouteWithAuth(true);
    }
  }

  async function handleLoginSuccess() {
    isAuthenticated = true;
    await fetchMe();
    navigate(defaultAuthRoute());
  }

  function handleLogout() {
    isAuthenticated = false;
    isManager = false;
    navigate(LOGIN_ROUTE, true);
  }

  onMount(() => {
    const handlePopState = () => {
      currentPath = window.location.pathname;
      syncRouteWithAuth(true);
    };

    currentPath = window.location.pathname;

    const init = isAuthenticated
      ? fetchMe().then(() => syncRouteWithAuth(true))
      : Promise.resolve(syncRouteWithAuth(true));

    void init;

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

{#if currentPath.startsWith(MANAGER_ROUTES_PREFIX) && isAuthenticated && isManager}
  <ManagerLayout {currentPath} {navigate} />
{:else if currentPath === DASHBOARD_ROUTE && isAuthenticated}
  <DashboardModule />
{:else}
  <LoginModule on:loginSuccess={handleLoginSuccess} />
{/if}
