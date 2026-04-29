<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { managerApi, type DailyEntry } from '../../../lib/api';

  export let navigate: (path: string) => void;

  let entries: DailyEntry[] = [];
  let filtered: DailyEntry[] = [];
  let loading = true;
  let error = '';
  let search = '';

  let refreshTimer: ReturnType<typeof setInterval>;

  const timeFormatter = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  });

  function fmtDuration(seconds: number): string {
    if (seconds === 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function fmtTime(iso: string | null): string {
    if (!iso) return '—';
    return timeFormatter.format(new Date(iso));
  }

  function openEntry(entry: DailyEntry) {
    navigate(`/manager/users/${entry.employee_id}`);
  }

  function handleRowKeydown(event: KeyboardEvent, entry: DailyEntry) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEntry(entry);
    }
  }

  function initials(entry: DailyEntry): string {
    return `${entry.first_name[0] ?? ''}${entry.last_name[0] ?? ''}`.toUpperCase();
  }

  async function loadData() {
    try {
      entries = await managerApi.getDaily();
      applyFilters();
    } catch {
      error = 'Nie udało się pobrać danych.';
    } finally {
      loading = false;
    }
  }

  function applyFilters() {
    const q = search.toLowerCase();
    filtered = entries.filter((e) => {
      const matchSearch =
        !q ||
        e.first_name.toLowerCase().includes(q) ||
        e.last_name.toLowerCase().includes(q) ||
        e.employee_id.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        e.employment.toLowerCase().includes(q);
      return matchSearch;
    });
  }

  $: {
    search;
    applyFilters();
  }

  $: presentCount = filtered.filter((entry) => entry.status === 'in').length;
  $: awayCount = filtered.length - presentCount;
  $: totalHours = filtered.reduce((sum, entry) => sum + entry.today_seconds, 0) / 3600;

  onMount(() => {
    loadData();
    refreshTimer = setInterval(loadData, 30_000);
  });

  onDestroy(() => clearInterval(refreshTimer));

  const today = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());
</script>

<div class="view-wrapper">
  <header class="view-header">
    <div>
      <h1>Dzisiejsza obecność</h1>
      <p class="subtitle">{today}</p>
    </div>
  </header>

  {#if loading}
    <p class="state-msg">Ładowanie…</p>
  {:else if error}
    <p class="state-msg error">{error}</p>
  {:else}
    <div class="overview-stats daily-stats">
      <article class="stat-tile daily-stat green">
        <p class="tile-label">Obecni</p>
        <div class="tile-main">
          <div>
            <p class="tile-value">{presentCount}</p>
            <p class="tile-note">w pracy</p>
          </div>
          <svg class="tile-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg>
        </div>
      </article>

      <article class="stat-tile daily-stat orange">
        <p class="tile-label">Nieobecni</p>
        <div class="tile-main">
          <div>
            <p class="tile-value">{awayCount}</p>
            <p class="tile-note">poza pracą</p>
          </div>
          <svg class="tile-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 8 5 5"/><path d="m22 8-5 5"/></svg>
        </div>
      </article>

      <article class="stat-tile daily-stat blue">
        <p class="tile-label">Łączny czas</p>
        <div class="tile-main">
          <div>
            <p class="tile-value">{totalHours.toFixed(1)}h</p>
            <p class="tile-note">przepracowanych</p>
          </div>
          <svg class="tile-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        </div>
      </article>
    </div>

    <article class="panel daily-list-panel">
      <div class="daily-list-head">
        <div>
          <h2>Lista obecności</h2>
          <p class="panel-subtitle">Wszyscy pracownicy ({filtered.length})</p>
        </div>
        <label class="table-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="search"
            placeholder="Szukaj pracownika..."
            bind:value={search}
            aria-label="Szukaj pracownika"
          />
        </label>
      </div>

      <div class="table-wrap daily-table-wrap">
        <table class="data-table daily-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Pracownik</th>
              <th>Etat</th>
              <th>Status</th>
              <th>Wejście</th>
              <th>Przepracowane</th>
              <th>Ostatnia aktywność</th>
            </tr>
          </thead>
          <tbody>
            {#each filtered as entry (entry.employee_id)}
              <tr
                role="button"
                tabindex="0"
                on:click={() => openEntry(entry)}
                on:keydown={(event) => handleRowKeydown(event, entry)}
              >
                <td class="mono">{entry.employee_id}</td>
                <td>
                  <div class="person-row">
                    <div class="avatar compact">{initials(entry)}</div>
                    <div>
                      <p class="person-name">{entry.first_name} {entry.last_name}</p>
                      <p class="person-meta">@{entry.username}</p>
                    </div>
                  </div>
                </td>
                <td>{entry.employment === 'FT' ? 'Pełny etat' : 'Część etatu'}</td>
                <td>
                  <span class="badge {entry.status}">
                    {entry.status === 'in' ? 'Obecny' : entry.status === 'out' ? 'Wyszedł' : 'Nieobecny'}
                  </span>
                </td>
                <td class="mono">{fmtTime(entry.started_at)}</td>
                <td class="mono">{fmtDuration(entry.today_seconds)}</td>
                <td class="mono">{fmtTime(entry.started_at)}</td>
              </tr>
            {:else}
              <tr>
                <td colspan="7" class="empty-row">Brak wyników</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </article>
  {/if}
</div>
