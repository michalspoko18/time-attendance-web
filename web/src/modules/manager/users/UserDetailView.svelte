<script lang="ts">
  import { onMount } from 'svelte';
  import {
    managerApi,
    type UserDetail,
    type WorkSession,
    type PaginatedResponse,
    type DailyBreakdownEntry
  } from '../../../lib/api';

  export let employeeId: string;
  export let navigate: (path: string) => void;

  let user: UserDetail | null = null;
  let sessions: PaginatedResponse<WorkSession> | null = null;
  let breakdown: DailyBreakdownEntry[] = [];
  let loading = true;
  let sessionsLoading = false;
  let error = '';

  let sessionPage = 1;
  let dateFrom = '';
  let dateTo = '';
  let statusFilter = '';

  const timeFormatter = new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'short'
  });

  function fmtSeconds(s: number): string {
    if (!s) return '—';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function fmtDatetime(iso: string | null): string {
    if (!iso) return '—';
    return timeFormatter.format(new Date(iso));
  }

  async function loadSessions(p: number) {
    sessionsLoading = true;
    try {
      sessions = await managerApi.getUserSessions(employeeId, {
        page: p,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status: statusFilter || undefined
      });
      sessionPage = p;
    } finally {
      sessionsLoading = false;
    }
  }

  function applySessionFilters() {
    loadSessions(1);
  }

  onMount(async () => {
    try {
      const [u, brk] = await Promise.all([
        managerApi.getUserDetail(employeeId),
        managerApi.getUserDailyBreakdown(employeeId)
      ]);
      user = u;
      breakdown = brk;
      await loadSessions(1);
    } catch {
      error = 'Nie udało się pobrać danych pracownika.';
    } finally {
      loading = false;
    }
  });
</script>

<div class="view-wrapper">
  <header class="view-header">
    <button class="back-btn ghost" type="button" on:click={() => navigate('/manager/users')}>
      ← Wróć do listy
    </button>
  </header>

  {#if loading}
    <p class="state-msg">Ładowanie…</p>
  {:else if error}
    <p class="state-msg error">{error}</p>
  {:else if user}
    <!-- User info card -->
    <div class="user-profile">
      <div class="profile-avatar" aria-hidden="true">
        {user.first_name[0]}{user.last_name[0]}
      </div>
      <div class="profile-info">
        <h1>{user.first_name} {user.last_name}</h1>
        <p class="subtitle">{user.email} · ID: {user.employee_id}</p>
        <div class="profile-badges">
          <span class="badge {user.today.status}">
            {user.today.status === 'in' ? 'W pracy' : user.today.status === 'out' ? 'Wyszedł dziś' : 'Nieobecny dziś'}
          </span>
          <span class="badge neutral">{user.employment === 'FT' ? 'Pełny etat' : 'Część etatu'}</span>
          {#if user.is_manager}<span class="badge warn">Manager</span>{/if}
          {#if !user.is_active}<span class="badge absent">Nieaktywny</span>{/if}
        </div>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="stats-row">
      <article class="stat-tile">
        <p class="tile-label">Dziś</p>
        <p class="tile-value">{fmtSeconds(user.stats.today_seconds)}</p>
      </article>
      <article class="stat-tile">
        <p class="tile-label">Ten tydzień</p>
        <p class="tile-value">{fmtSeconds(user.stats.week_seconds)}</p>
      </article>
      <article class="stat-tile">
        <p class="tile-label">Ten miesiąc</p>
        <p class="tile-value">{fmtSeconds(user.stats.month_seconds)}</p>
      </article>
      <article class="stat-tile">
        <p class="tile-label">Łącznie sesji</p>
        <p class="tile-value">{user.stats.total_sessions}</p>
      </article>
    </div>

    <!-- Daily breakdown (last 30 days) -->
    {#if breakdown.length > 0}
      <section class="panel breakdown-section">
        <h2>Godziny dziennie (ostatnie 30 dni)</h2>
        <div class="bar-chart" aria-label="Wykres godzin dziennie">
          {#each breakdown as day}
            {@const maxSeconds = Math.max(...breakdown.map((d) => d.total_seconds), 1)}
            {@const pct = Math.round((day.total_seconds / maxSeconds) * 100)}
            <div class="bar-col">
              <div
                class="bar-fill"
                style="height: {pct}%"
                title="{day.date}: {fmtSeconds(day.total_seconds)}"
              ></div>
              <span class="bar-label">{day.date.slice(5)}</span>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Sessions table -->
    <section class="panel">
      <div class="section-header">
        <h2>Historia sesji</h2>
      </div>

      <div class="session-filters">
        <input
          type="date"
          class="filter-input"
          bind:value={dateFrom}
          aria-label="Data od"
        />
        <span class="filter-sep">—</span>
        <input
          type="date"
          class="filter-input"
          bind:value={dateTo}
          aria-label="Data do"
        />
        <select class="filter-select" bind:value={statusFilter} aria-label="Status sesji">
          <option value="">Wszystkie</option>
          <option value="open">Otwarte</option>
          <option value="closed">Zamknięte</option>
        </select>
        <button class="ghost" type="button" on:click={applySessionFilters}>Filtruj</button>
      </div>

      {#if sessionsLoading}
        <p class="state-msg">Ładowanie sesji…</p>
      {:else if sessions}
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Wejście</th>
                <th>Wyjście</th>
                <th>Czas trwania</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {#each sessions.results as s (s.id)}
                <tr>
                  <td class="mono small">{s.id}</td>
                  <td class="mono">{fmtDatetime(s.started_at)}</td>
                  <td class="mono">{fmtDatetime(s.ended_at)}</td>
                  <td class="mono">{fmtSeconds(s.duration_seconds ?? 0)}</td>
                  <td>
                    <span class="badge {s.status === 'open' ? 'in' : 'neutral'}">
                      {s.status === 'open' ? 'Otwarta' : 'Zamknięta'}
                    </span>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="5" class="empty-row">Brak sesji dla wybranych filtrów.</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {#if sessions.previous || sessions.next}
          <div class="pagination">
            <button
              class="ghost"
              type="button"
              disabled={!sessions.previous}
              on:click={() => loadSessions(sessionPage - 1)}
            >← Poprzednia</button>
            <span class="page-info">Strona {sessionPage} · {sessions.count} sesji</span>
            <button
              class="ghost"
              type="button"
              disabled={!sessions.next}
              on:click={() => loadSessions(sessionPage + 1)}
            >Następna →</button>
          </div>
        {/if}
      {/if}
    </section>
  {/if}
</div>
