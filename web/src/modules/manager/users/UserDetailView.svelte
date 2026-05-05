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

  type RegistrationRow = {
    id: string;
    at: string;
    type: 'in' | 'out';
  };

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

  const dateFormatter = new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const shortDateFormatter = new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const timeFormatter = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  });

  function fmtSeconds(s: number): string {
    if (!s) return '—';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function fmtDate(iso: string): string {
    return shortDateFormatter.format(new Date(iso));
  }

  function fmtLongDate(date: string): string {
    return dateFormatter.format(new Date(`${date}T12:00:00`));
  }

  function fmtTime(iso: string | null): string {
    if (!iso) return '—';
    return timeFormatter.format(new Date(iso));
  }

  function initials(u: UserDetail): string {
    return `${u.first_name[0] ?? ''}${u.last_name[0] ?? ''}`.toUpperCase();
  }

  function employmentLabel(employment: string): string {
    return employment === 'FT' ? 'Pełny etat' : 'Pół etatu';
  }

  function workHours(employment: string): number {
    return employment === 'FT' ? 8 : 4;
  }

  function eventRows(sessionData: PaginatedResponse<WorkSession> | null) {
    return (sessionData?.results ?? [])
      .flatMap((session) => {
        const rows: RegistrationRow[] = [
          {
            id: `${session.id}-in`,
            at: session.started_at,
            type: 'in' as const
          }
        ];

        if (session.ended_at) {
          rows.push({
            id: `${session.id}-out`,
            at: session.ended_at,
            type: 'out' as const
          });
        }

        return rows;
      })
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
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

  $: checkIns = sessions?.results.length ?? user?.stats.total_sessions ?? 0;
  $: checkOuts = sessions?.results.filter((session) => session.ended_at).length ?? 0;
  $: registrationRows = eventRows(sessions);
</script>

<div class="view-wrapper">
  {#if loading}
    <p class="state-msg">Ładowanie…</p>
  {:else if error}
    <p class="state-msg error">{error}</p>
  {:else if user}
    <header class="detail-header">
      <button class="icon-back" type="button" aria-label="Wróć do listy pracowników" on:click={() => navigate('/manager/users')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
      </button>
      <div>
        <h1>Szczegóły pracownika</h1>
        <p class="subtitle">{user.first_name} {user.last_name}</p>
      </div>
    </header>

    <article class="panel user-detail-card">
      <div class="user-detail-top">
        <div class="profile-avatar detail-avatar" aria-hidden="true">{initials(user)}</div>
        <div class="profile-info">
          <h2>{user.first_name} {user.last_name}</h2>
          <p class="person-meta">ID: {user.employee_id}</p>
          <p class="detail-meta-line">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            {user.email}
          </p>
          <p class="person-meta">Stanowisko: {user.is_manager ? 'Manager' : 'Pracownik'}</p>
          <p class="person-meta">Etat: {employmentLabel(user.employment)} ({workHours(user.employment)}h/dzień)</p>
        </div>
      </div>

      <div class="detail-stats-grid">
        <article class="detail-stat neutral">
          <p>Łączne rejestracje</p>
          <strong>{checkIns + checkOuts}</strong>
        </article>
        <article class="detail-stat green">
          <p>Wejścia</p>
          <strong>{checkIns}</strong>
        </article>
        <article class="detail-stat orange">
          <p>Wyjścia</p>
          <strong>{checkOuts}</strong>
        </article>
        <article class="detail-stat blue">
          <p>Łączny czas pracy</p>
          <strong>{fmtSeconds(user.stats.total_seconds)}</strong>
        </article>
      </div>
    </article>

    <section class="panel user-detail-section">
      <div>
        <h2>Statystyki dzienne</h2>
        <p class="panel-subtitle">Przepracowane godziny w poszczególnych dniach</p>
      </div>

      {#if breakdown.length === 0}
        <p class="empty-row">Brak danych o czasie pracy</p>
      {:else}
        <div class="daily-breakdown-list">
          {#each breakdown as day (day.date)}
            {@const hours = day.total_seconds / 3600}
            {@const target = workHours(user.employment)}
            {@const isComplete = hours >= target}
            <article class="daily-breakdown-row">
              <div class="breakdown-date">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>
                <div>
                  <p>{fmtLongDate(day.date)}</p>
                  <span>{day.date}</span>
                </div>
              </div>
              <div class="breakdown-hours {isComplete ? 'complete' : 'partial'}">
                <span>{hours.toFixed(1)}h / {target}h</span>
                <small>{Math.round((hours / target) * 100)}% normy</small>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <section class="panel user-detail-section">
      <div class="section-header">
        <div>
          <h2>Historia rejestracji</h2>
          <p class="panel-subtitle">Wszystkie skanowania ({registrationRows.length})</p>
        </div>
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
        <div class="table-wrap daily-table-wrap">
          <table class="data-table daily-table detail-history-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Godzina</th>
                <th>Typ zdarzenia</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {#each registrationRows as row (row.id)}
                <tr>
                  <td>
                    <span class="icon-text">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>
                      {fmtDate(row.at)}
                    </span>
                  </td>
                  <td>
                    <span class="icon-text">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      {fmtTime(row.at)}
                    </span>
                  </td>
                  <td>
                    <span class="event-type {row.type}">
                      {#if row.type === 'in'}
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/></svg>
                        Wejście
                      {:else}
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
                        Wyjście
                      {/if}
                    </span>
                  </td>
                  <td>
                    <span class="badge {row.type === 'in' ? 'in' : 'absent'}">
                      Zarejestrowano
                    </span>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="4" class="empty-row">Brak rejestracji dla wybranych filtrów.</td>
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
