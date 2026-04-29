<script lang="ts">
  import { onMount } from 'svelte';
  import { managerApi, type ManagerOverview, type DailyEntry } from '../../../lib/api';

  export let navigate: (path: string) => void;

  let overview: ManagerOverview | null = null;
  let dailyEntries: DailyEntry[] = [];
  let loading = true;
  let error = '';

  const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  let now = new Date();

  function fmtDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function fmtTime(iso: string | null): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(iso));
  }

  function initials(entry: DailyEntry): string {
    return `${entry.first_name[0] ?? ''}${entry.last_name[0] ?? ''}`.toUpperCase();
  }

  $: presentToday = dailyEntries.filter((entry) => entry.status === 'in');
  $: workedToday = dailyEntries.filter((entry) => entry.today_seconds > 0);
  $: topWorkers = [...workedToday]
    .sort((a, b) => b.today_seconds - a.today_seconds)
    .slice(0, 3);
  $: avgHours =
    workedToday.length > 0
      ? workedToday.reduce((sum, entry) => sum + entry.today_seconds, 0) / workedToday.length / 3600
      : 0;
  $: presencePercent =
    overview && overview.total_users > 0 ? Math.round((overview.users_in / overview.total_users) * 100) : 0;

  onMount(async () => {
    now = new Date();
    try {
      const [ov, daily] = await Promise.all([
        managerApi.getOverview(),
        managerApi.getDaily()
      ]);
      overview = ov;
      dailyEntries = daily;
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
      <h1>Dashboard</h1>
      <p class="subtitle">{dateFormatter.format(now)}</p>
    </div>
  </header>

  {#if loading}
    <p class="state-msg">Ładowanie…</p>
  {:else if error}
    <p class="state-msg error">{error}</p>
  {:else if overview}
    <div class="overview-stats dashboard-cards">
      <article class="stat-tile dashboard-stat purple">
        <p class="tile-label">Wszyscy pracownicy</p>
        <div class="tile-main">
          <div>
            <p class="tile-value">{overview.total_users}</p>
            <p class="tile-note">osób w zespole</p>
          </div>
          <svg class="tile-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
      </article>
      <article class="stat-tile dashboard-stat green">
        <p class="tile-label">Dziś w pracy</p>
        <div class="tile-main">
          <div>
            <p class="tile-value">{overview.users_in}</p>
            <p class="tile-note">{presencePercent}% obecności</p>
          </div>
          <svg class="tile-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>
        </div>
      </article>
      <article class="stat-tile dashboard-stat blue">
        <p class="tile-label">Średnia czasu pracy</p>
        <div class="tile-main">
          <div>
            <p class="tile-value">{avgHours.toFixed(1)}h</p>
            <p class="tile-note">w tym tygodniu</p>
          </div>
          <svg class="tile-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
      </article>
      <article class="stat-tile dashboard-stat orange">
        <p class="tile-label">Wejścia dzisiaj</p>
        <div class="tile-main">
          <div>
            <p class="tile-value">{overview.users_worked_today}</p>
            <p class="tile-note">skanowań</p>
          </div>
          <svg class="tile-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>
        </div>
      </article>
    </div>

    <div class="dash-grid">
      <article class="panel">
        <div class="panel-head">
          <div>
            <h2>Dzisiejsza obecność</h2>
            <p class="panel-subtitle">Podgląd pracowników w pracy</p>
          </div>
          <button class="ghost-link" type="button" on:click={() => navigate('/manager/daily')}>
            Zobacz wszystkich
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
        {#if presentToday.length === 0}
          <p class="muted empty-card">Nikt nie jest teraz w pracy.</p>
        {:else}
          <ul class="presence-list">
            {#each presentToday.slice(0, 5) as entry}
              <li>
                <button class="dashboard-row" type="button" on:click={() => navigate(`/manager/users/${entry.employee_id}`)}>
                  <div class="person-row">
                    <div class="avatar">{initials(entry)}</div>
                    <div>
                      <p class="person-name">{entry.first_name} {entry.last_name}</p>
                      <p class="person-meta">{entry.employment === 'FT' ? 'Pełny etat' : 'Część etatu'}</p>
                    </div>
                  </div>
                  <div class="presence-right">
                    <span class="badge in">W pracy</span>
                    <span class="duration">od {fmtTime(entry.started_at)}</span>
                  </div>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </article>

      <article class="panel">
        <div class="panel-head">
          <div>
            <h2>Top pracownicy dziś</h2>
            <p class="panel-subtitle">Najwięcej przepracowanych godzin</p>
          </div>
          <button class="ghost-link" type="button" on:click={() => navigate('/manager/users')}>
            Wszyscy pracownicy
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
        {#if topWorkers.length === 0}
          <p class="muted empty-card">Brak przepracowanych godzin do wyświetlenia.</p>
        {:else}
          <ul class="presence-list">
            {#each topWorkers as entry, index}
              <li>
                <button class="dashboard-row" type="button" on:click={() => navigate(`/manager/users/${entry.employee_id}`)}>
                  <div class="person-row">
                    <div class="rank-avatar">{index + 1}</div>
                    <div>
                      <p class="person-name">{entry.first_name} {entry.last_name}</p>
                      <p class="person-meta">{entry.employment === 'FT' ? 'Pełny etat' : 'Część etatu'}</p>
                    </div>
                  </div>
                  <div class="presence-right">
                    <span class="work-hours">{fmtDuration(entry.today_seconds)}</span>
                    <span class="duration">dzisiaj</span>
                  </div>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </article>
    </div>
  {/if}
</div>
