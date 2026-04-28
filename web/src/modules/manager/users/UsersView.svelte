<script lang="ts">
  import { onMount } from 'svelte';
  import { managerApi, type ManagerUser, type PaginatedResponse } from '../../../lib/api';

  export let navigate: (path: string) => void;

  let data: PaginatedResponse<ManagerUser> | null = null;
  let loading = true;
  let error = '';
  let search = '';
  let page = 1;
  const pageSize = 20;

  async function loadPage(p: number) {
    loading = true;
    error = '';
    try {
      data = await managerApi.getUsers({ page: p });
      page = p;
    } catch {
      error = 'Nie udało się pobrać listy pracowników.';
    } finally {
      loading = false;
    }
  }

  $: filtered = (data?.results ?? []).filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.employee_id.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  onMount(() => loadPage(1));
</script>

<div class="view-wrapper">
  <header class="view-header">
    <div>
      <p class="eyebrow">Pracownicy</p>
      <h1>Wszyscy użytkownicy</h1>
      {#if data}
        <p class="subtitle">{data.count} rekordów</p>
      {/if}
    </div>
  </header>

  <div class="toolbar">
    <input
      class="search-input"
      type="search"
      placeholder="Szukaj (imię, nazwisko, ID, email)…"
      bind:value={search}
      aria-label="Szukaj użytkownika"
    />
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
            <th>Imię i nazwisko</th>
            <th>Email</th>
            <th>ID pracownika</th>
            <th>Etat</th>
            <th>Rola</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as user (user.id)}
            <tr>
              <td>
                <p class="person-name">{user.first_name} {user.last_name}</p>
                <p class="person-meta">@{user.username}</p>
              </td>
              <td class="mono small">{user.email}</td>
              <td class="mono">{user.employee_id}</td>
              <td>{user.employment === 'FT' ? 'Pełny etat' : 'Część etatu'}</td>
              <td>
                {#if user.is_manager}
                  <span class="badge warn">Manager</span>
                {:else}
                  <span class="badge neutral">Pracownik</span>
                {/if}
              </td>
              <td>
                <span class="badge {user.is_active ? 'in' : 'absent'}">
                  {user.is_active ? 'Aktywny' : 'Nieaktywny'}
                </span>
              </td>
              <td>
                <button
                  class="row-link"
                  type="button"
                  on:click={() => navigate(`/manager/users/${user.employee_id}`)}
                >
                  Szczegóły →
                </button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="empty-row">Brak wyników.</td>
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
  {/if}
</div>
