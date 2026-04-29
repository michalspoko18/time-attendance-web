<script lang="ts">
  import { onMount } from 'svelte';
  import { managerApi, type DailyEntry, type ManagerUser, type PaginatedResponse } from '../../../lib/api';

  export let navigate: (path: string) => void;

  let data: PaginatedResponse<ManagerUser> | null = null;
  let dailyEntries: DailyEntry[] = [];
  let loading = true;
  let error = '';
  let search = '';
  let page = 1;

  async function loadPage(p: number) {
    loading = true;
    error = '';
    try {
      const [users, daily] = await Promise.all([
        managerApi.getUsers({ page: p }),
        managerApi.getDaily()
      ]);
      data = users;
      dailyEntries = daily;
      page = p;
    } catch {
      error = 'Nie udało się pobrać listy pracowników.';
    } finally {
      loading = false;
    }
  }

  function initials(user: ManagerUser): string {
    return `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase();
  }

  function employmentLabel(employment: string): string {
    return employment === 'FT' ? 'Pełny etat' : 'Pół etatu';
  }

  function workHours(employment: string): number {
    return employment === 'FT' ? 8 : 4;
  }

  function expectedSeconds(user: ManagerUser): number {
    return workHours(user.employment) * 3600;
  }

  function missingSeconds(user: ManagerUser, status: DailyEntry | undefined): number {
    return Math.max(0, expectedSeconds(user) - (status?.today_seconds ?? 0));
  }

  function overtimeSeconds(user: ManagerUser, status: DailyEntry | undefined): number {
    return Math.max(0, (status?.today_seconds ?? 0) - expectedSeconds(user));
  }

  function fmtDuration(seconds: number): string {
    if (seconds === 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function hoursBalanceTooltip(missing: number, overtime: number): string {
    if (missing > 0) return `Brakuje ${fmtDuration(missing)}`;
    if (overtime > 0) return `Nadgodziny ${fmtDuration(overtime)}`;
    return 'Zgodnie z planem';
  }

  function todayStatus(user: ManagerUser): DailyEntry | undefined {
    return dailyEntries.find((entry) => entry.employee_id === user.employee_id);
  }

  function openUser(user: ManagerUser) {
    navigate(`/manager/users/${user.employee_id}`);
  }

  function handleRowKeydown(event: KeyboardEvent, user: ManagerUser) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openUser(user);
    }
  }

  $: filtered = (data?.results ?? []).filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.employee_id.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      employmentLabel(u.employment).toLowerCase().includes(q)
    );
  });

  onMount(() => loadPage(1));
</script>

<div class="view-wrapper">
  <header class="view-header">
    <div>
      <h1>Pracownicy</h1>
      <p class="subtitle">Zarządzaj wszystkimi pracownikami w systemie</p>
    </div>
  </header>

  {#if loading}
    <p class="state-msg">Ładowanie…</p>
  {:else if error}
    <p class="state-msg error">{error}</p>
  {:else}
    <article class="panel daily-list-panel users-list-panel">
      <div class="daily-list-head">
        <div>
          <h2>Lista pracowników</h2>
          <p class="panel-subtitle">Wszyscy pracownicy ({filtered.length})</p>
        </div>
        <label class="table-search users-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="search"
            placeholder="Szukaj po nazwisku, ID, email..."
            bind:value={search}
            aria-label="Szukaj pracownika"
          />
        </label>
      </div>

      <div class="table-wrap daily-table-wrap">
        <table class="data-table daily-table users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Pracownik</th>
              <th>Email</th>
              <th>Stanowisko</th>
              <th>Etat</th>
              <th>Status dzisiaj</th>
              <th class="actions-cell">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {#each filtered as user (user.id)}
              {@const status = todayStatus(user)}
              {@const missing = missingSeconds(user, status)}
              {@const overtime = overtimeSeconds(user, status)}
              <tr
                role="button"
                tabindex="0"
                on:click={() => openUser(user)}
                on:keydown={(event) => handleRowKeydown(event, user)}
              >
                <td class="mono">{user.employee_id}</td>
                <td>
                  <div class="person-row">
                    <div class="avatar">{initials(user)}</div>
                    <div>
                      <p class="person-name">{user.first_name} {user.last_name}</p>
                      <p class="person-meta">{user.employee_id}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="email-cell">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    <span>{user.email}</span>
                  </div>
                </td>
                <td>{user.is_manager ? 'Manager' : 'Pracownik'}</td>
                <td>
                  <span class="badge outline">{employmentLabel(user.employment)}</span>
                  <p class="person-meta">{workHours(user.employment)}h/dzień</p>
                </td>
                <td>
                  {#if status?.status === 'in'}
                    <span class="badge in">Obecny</span>
                    <p class="person-meta status-hours">
                      <span>{fmtDuration(status.today_seconds)} / {workHours(user.employment)}h</span>
                      <button class="tooltip-wrap" type="button" aria-label={hoursBalanceTooltip(missing, overtime)}>
                        <span class:complete={missing === 0 && overtime === 0} class:overtime={overtime > 0} class="hours-info">i</span>
                        <span class="tooltip">{hoursBalanceTooltip(missing, overtime)}</span>
                      </button>
                    </p>
                  {:else if status?.status === 'out'}
                    <span class="badge out">Wyszedł</span>
                    <p class="person-meta status-hours">
                      <span>{fmtDuration(status.today_seconds)} / {workHours(user.employment)}h</span>
                      <button class="tooltip-wrap" type="button" aria-label={hoursBalanceTooltip(missing, overtime)}>
                        <span class:complete={missing === 0 && overtime === 0} class:overtime={overtime > 0} class="hours-info">i</span>
                        <span class="tooltip">{hoursBalanceTooltip(missing, overtime)}</span>
                      </button>
                    </p>
                  {:else}
                    <span class="badge absent">Nieobecny</span>
                    <p class="person-meta status-hours">
                      <span>0h / {workHours(user.employment)}h</span>
                      <button class="tooltip-wrap" type="button" aria-label={hoursBalanceTooltip(missing, overtime)}>
                        <span class="hours-info">i</span>
                        <span class="tooltip">{hoursBalanceTooltip(missing, overtime)}</span>
                      </button>
                    </p>
                  {/if}
                </td>
                <td class="actions-cell">
                  <button
                    class="details-button"
                    type="button"
                    on:click|stopPropagation={() => openUser(user)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2.06 12.35a1 1 0 0 1 0-.7A11.96 11.96 0 0 1 12 4c4.77 0 8.75 2.8 9.94 7.65a1 1 0 0 1 0 .7A11.96 11.96 0 0 1 12 20c-4.77 0-8.75-2.8-9.94-7.65Z"/><circle cx="12" cy="12" r="3"/></svg>
                    Szczegóły
                  </button>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="7" class="empty-row">Brak wyników</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if data && (data.previous || data.next)}
        <div class="pagination">
          <button
            class="ghost"
            type="button"
            disabled={!data.previous}
            on:click={() => loadPage(page - 1)}
          >← Poprzednia</button>
          <span class="page-info">Strona {page}</span>
          <button
            class="ghost"
            type="button"
            disabled={!data.next}
            on:click={() => loadPage(page + 1)}
          >Następna →</button>
        </div>
      {/if}
    </article>
  {/if}
</div>
