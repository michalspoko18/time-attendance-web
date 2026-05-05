<script lang="ts">
  import { onMount } from 'svelte';
  import LoginModule from './modules/login/LoginModule.svelte';
  import ManagerLayout from './modules/manager/ManagerLayout.svelte';
  import { api } from './lib/api';
  import type { AuthUser } from './lib/api';
  import { clearSession, getAccessToken } from './lib/auth';

  const LOGIN_ROUTE = '/login';
  const MANAGER_ROUTES_PREFIX = '/manager';
  const MANAGER_DASHBOARD_ROUTE = '/manager/dashboard';

  let isAuthenticated = Boolean(getAccessToken());
  let isManager = false;
  let currentUser: AuthUser | null = null;
  let currentPath = '/';
  let loginError = '';

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
    return MANAGER_DASHBOARD_ROUTE;
  }

  function denyAccessForNonManager() {
    loginError = 'Dostęp do aplikacji jest dostępny tylko dla managerów.';
    isAuthenticated = false;
    isManager = false;
    currentUser = null;
    clearSession();
    navigate(LOGIN_ROUTE, true);
  }

  function syncRouteWithAuth(replace = true) {
    const isManagerRoute = currentPath.startsWith(MANAGER_ROUTES_PREFIX);
    const isKnownPublicRoute = currentPath === LOGIN_ROUTE;

    if (!isAuthenticated) {
      if (currentPath !== LOGIN_ROUTE) {
        navigate(LOGIN_ROUTE, true);
      }
      return;
    }

    if (!isManager) {
      denyAccessForNonManager();
      return;
    }

    if (currentPath === LOGIN_ROUTE) {
      navigate(defaultAuthRoute(), replace);
      return;
    }

    if (!isKnownPublicRoute && !isManagerRoute) {
      navigate(defaultAuthRoute(), true);
    }
  }

  async function fetchMe() {
    try {
      const response = await api.get<AuthUser>('/api/auth/me/');
      currentUser = response.data;
      isManager = currentUser?.is_manager ?? false;
    } catch {
      currentUser = null;
      isManager = false;
    }
  }

  function syncAuthState() {
    isAuthenticated = Boolean(getAccessToken());
    if (isAuthenticated) {
      fetchMe().then(() => syncRouteWithAuth(true));
    } else {
      isManager = false;
      currentUser = null;
      syncRouteWithAuth(true);
    }
  }

  async function handleLoginSuccess() {
    isAuthenticated = true;
    loginError = '';
    await fetchMe();

    if (!isManager) {
      denyAccessForNonManager();
      return;
    }

    navigate(defaultAuthRoute());
  }

  function handleLogout() {
    isAuthenticated = false;
    isManager = false;
    currentUser = null;
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
  <ManagerLayout {currentPath} {navigate} {currentUser} />
{:else}
  <LoginModule {loginError} on:loginSuccess={handleLoginSuccess} />
{/if}
