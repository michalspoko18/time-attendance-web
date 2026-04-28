<script lang="ts">
  import { clearSession } from '../../lib/auth';
  import ManagerDashboard from './dashboard/ManagerDashboard.svelte';
  import DailyView from './daily/DailyView.svelte';
  import UsersView from './users/UsersView.svelte';
  import UserDetailView from './users/UserDetailView.svelte';

  export let currentPath: string;
  export let navigate: (path: string, replace?: boolean) => void;

  $: activeView = resolveView(currentPath);
  $: selectedEmployeeId = resolveEmployeeId(currentPath);

  function resolveView(path: string): 'dashboard' | 'daily' | 'users' | 'user-detail' {
    if (path.startsWith('/manager/users/') && path.length > '/manager/users/'.length) {
      return 'user-detail';
    }
    if (path === '/manager/users') return 'users';
    if (path === '/manager/daily') return 'daily';
    return 'dashboard';
  }

  function resolveEmployeeId(path: string): string {
    const prefix = '/manager/users/';
    if (path.startsWith(prefix)) {
      return path.slice(prefix.length).replace(/\/$/, '');
    }
    return '';
  }

  const navItems = [
    { label: 'Dashboard', path: '/manager/dashboard', view: 'dashboard' },
    { label: 'Dziś w pracy', path: '/manager/daily', view: 'daily' },
    { label: 'Pracownicy', path: '/manager/users', view: 'users' },
  ] as const;

  function handleLogout() {
    clearSession();
  }
</script>

<div class="manager-shell">
  <nav class="manager-sidebar" aria-label="Manager navigation">
    <div class="sidebar-brand">
      <p class="brand-name">Panel Managera</p>
      <p class="brand-role">Administrator</p>
    </div>

    <ul class="sidebar-nav" role="list">
      {#each navItems as item}
        <li>
          <button
            class="nav-link"
            class:active={activeView === item.view}
            type="button"
            on:click={() => navigate(item.path)}
          >
            {#if item.view === 'dashboard'}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            {:else if item.view === 'daily'}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>
            {:else}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {/if}
            {item.label}
          </button>
        </li>
      {/each}
    </ul>

    <div class="sidebar-footer">
      <button class="nav-link logout" type="button" on:click={handleLogout}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Wyloguj
      </button>
    </div>
  </nav>

  <main class="manager-content">
    {#if activeView === 'dashboard'}
      <ManagerDashboard {navigate} />
    {:else if activeView === 'daily'}
      <DailyView {navigate} />
    {:else if activeView === 'user-detail'}
      <UserDetailView employeeId={selectedEmployeeId} {navigate} />
    {:else}
      <UsersView {navigate} />
    {/if}
  </main>
</div>
