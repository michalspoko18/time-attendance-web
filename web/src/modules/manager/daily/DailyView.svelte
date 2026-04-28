<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { managerApi, type DailyEntry } from '../../../lib/api';

  export let navigate: (path: string) => void;

  let entries: DailyEntry[] = [];
  let filtered: DailyEntry[] = [];
  let loading = true;
  let error = '';
  let search = '';
  let filterStatus: 'all' | 'in' | 'out' | 'absent' = 'all';

  let refreshTimer: ReturnType<typeof setInterval>;

  const timeFormatter = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'short'
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
      const matchStatus = filterStatus === 'all' || e.status === filterStatus;
      const matchSearch =
        !q ||
        e.first_name.toLowerCase().includes(q) ||
        e.last_name.toLowerCase().includes(q) ||
        e.employee_id.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }

  $: {
    search;
    filterStatus;
    applyFilters();
  }

  onMount(() => {
    loadData();
    refreshTimer = setInterval(loadData, 30_000);
  });

  onDestroy(() => clearInterval(refreshTimer));

  const today = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());
</script>

<div class="view-wrapper">
  <header class="view-header">
    <div>
      <p class="eyebrow">Widok dzienny</p>
      <h1>Obecność — dziś</h1>
      <p class="subtitle">{today} · odświeżanie co 30s</p>
    </div>
  </header>

  <div class="toolbar">
    <input
      class="search-input"
      type="search"
      placeholder="Szukaj pracownika…"
      bind:value={search}
      aria-label="Szukaj pracownika"
    />
    <div class="filter-pills" role="group" aria-label="Filtruj status">
      {#each (['all', 'in', 'out', 'absent'] as const) as s}
        <button
          class="pill"
          class:active={filterStatus === s}
          type="button"
          on:click={() => (filterStatus = s)}
        >
          {s === 'all' ? 'Wszyscy' : s === 'in' ? 'W pracy' : s === 'out' ? 'Wyszli' : 'Nieobecni'}
        </button>
      {/each}
    </div>
  </div>

  {#if loading}
    <p class="state-msg">Ładowanie…</p>
  {:else if error}
    <p class="state-msg error">{error}</p>
  {:else}
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Pracownik</th>
            <th>ID</th>
            <th>Etat</th>
            <th>Status</th>
            <th>Wejście</th>
            <th>Czas dziś</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as entry (entry.employee_id)}
            <tr>
              <td>
                <div class="person-cell">
                  <p class="person-name">{entry.first_name} {entry.last_name}</p>
                </div>
              </td>
              <td class="mono">{entry.employee_id}</td>
              <td>{entry.employment === 'FT' ? 'Pełny' : 'Część.'}</td>
              <td>
                <span class="badge {entry.status}">
                  {entry.status === 'in' ? 'W pracy' : entry.status === 'out' ? 'Wyszedł' : 'Nieobecny'}
                </span>
              </td>
              <td class="mono">{fmtTime(entry.started_at)}</td>
              <td class="mono">{fmtDuration(entry.today_seconds)}</td>
              <td>
                <button
                  class="row-link"
                  type="button"
                  on:click={() => navigate(`/manager/users/${entry.employee_id}`)}
                >
                  Szczegóły →
                </button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="empty-row">Brak wyników dla wybranych filtrów.</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
