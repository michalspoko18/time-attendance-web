<script lang="ts">
  import { onMount } from 'svelte';
  import { managerApi, type ManagerOverview, type DailyEntry } from '../../../lib/api';

  export let navigate: (path: string) => void;

  let overview: ManagerOverview | null = null;
  let topPresent: DailyEntry[] = [];
  let loading = true;
  let error = '';

  const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const timeFormatter = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  });

  let now = new Date();
  let timer: ReturnType<typeof setInterval>;

  import { onDestroy } from 'svelte';
  onDestroy(() => clearInterval(timer));

  function fmtDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  onMount(async () => {
    timer = setInterval(() => (now = new Date()), 1000);
    try {
      const [ov, daily] = await Promise.all([
        managerApi.getOverview(),
        managerApi.getDaily()
      ]);
      overview = ov;
      topPresent = daily.filter((e) => e.status === 'in').slice(0, 5);
    } catch {
      error = 'Nie udało się pobrać danych.';
    } finally {
      loading = false;
    }
  });
</script>

<div class="view-wrapper">
  <header class="view-header">
    <div>
      <p class="eyebrow">Panel managera</p>
      <h1>Dashboard</h1>
      <p class="subtitle">{dateFormatter.format(now)} · {timeFormatter.format(now)}</p>
    </div>
  </header>

  {#if loading}
    <p class="state-msg">Ładowanie…</p>
  {:else if error}
    <p class="state-msg error">{error}</p>
  {:else if overview}
    <div class="overview-stats">
      <article class="stat-tile">
        <p class="tile-label">Wszyscy pracownicy</p>
        <p class="tile-value">{overview.total_users}</p>
      </article>
      <article class="stat-tile ok">
        <p class="tile-label">Aktualnie w pracy</p>
        <p class="tile-value">{overview.users_in}</p>
      </article>
      <article class="stat-tile warn">
        <p class="tile-label">Pracowali dziś</p>
        <p class="tile-value">{overview.users_worked_today}</p>
      </article>
      <article class="stat-tile alert">
        <p class="tile-label">Nieobecni dziś</p>
        <p class="tile-value">{overview.users_absent}</p>
      </article>
    </div>

    <div class="dash-grid">
      <article class="panel">
        <h2>Obecnie w pracy</h2>
        {#if topPresent.length === 0}
          <p class="muted">Nikt nie jest teraz w pracy.</p>
        {:else}
          <ul class="presence-list">
            {#each topPresent as entry}
              <li>
                <div>
                  <p class="person-name">{entry.first_name} {entry.last_name}</p>
                  <p class="person-meta">{entry.employee_id}</p>
                </div>
                <div class="presence-right">
                  <span class="badge in">W pracy</span>
                  <span class="duration">{fmtDuration(entry.today_seconds)}</span>
                </div>
              </li>
            {/each}
          </ul>
          {#if overview.users_in > 5}
            <button class="link-btn" type="button" on:click={() => navigate('/manager/daily')}>
              +{overview.users_in - 5} więcej →
            </button>
          {/if}
        {/if}
      </article>

      <article class="panel quick-links">
        <h2>Przejdź do</h2>
        <div class="link-grid">
          <button class="quick-card" type="button" on:click={() => navigate('/manager/daily')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            <span>Widok dzienny</span>
            <p class="card-sub">Kto dziś jest w pracy i od kiedy</p>
          </button>
          <button class="quick-card" type="button" on:click={() => navigate('/manager/users')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Pracownicy</span>
            <p class="card-sub">Lista wszystkich użytkowników</p>
          </button>
        </div>
      </article>
    </div>
  {/if}
</div>
