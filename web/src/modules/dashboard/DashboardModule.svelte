<script lang="ts">
  import { onDestroy } from 'svelte';
  import { clearSession } from '../../lib/auth';

  const teamStats = [
    { label: 'Obecni', value: '18', tone: 'ok' },
    { label: 'Spóźnienia', value: '2', tone: 'warn' },
    { label: 'Nieobecności', value: '1', tone: 'alert' }
  ];

  const events = [
    { person: 'Alicja Nowak', action: 'Rozpoczęła zmianę', time: '08:02' },
    { person: 'Marek Piotrowski', action: 'Przerwa zakończona', time: '10:18' },
    { person: 'Sara Kowalska', action: 'Zgłoszono urlop', time: '11:05' },
    { person: 'Jan Zieliński', action: 'Wyjście służbowe', time: '11:32' }
  ];

  const quickActions = ['Dodaj wpis czasu', 'Zgłoś nieobecność', 'Pobierz raport'];

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
  const timer = setInterval(() => {
    now = new Date();
  }, 1000);

  onDestroy(() => {
    clearInterval(timer);
  });

  function handleLogout() {
    clearSession();
  }
</script>

<main class="dashboard-page">
  <section class="dashboard-card" aria-labelledby="dashboard-title">
    <header class="dashboard-header">
      <div>
        <p class="eyebrow">Panel zespołu</p>
        <h1 id="dashboard-title">Dashboard</h1>
        <p class="subtitle">{dateFormatter.format(now)} · {timeFormatter.format(now)}</p>
      </div>
      <button class="ghost" type="button" on:click={handleLogout}>Wyloguj</button>
    </header>

    <div class="dashboard-grid">
      <article class="panel spotlight" aria-labelledby="today-title">
        <h2 id="today-title">Status dnia</h2>
        <p class="lead">78% zespołu rozpoczęło pracę przed 08:15.</p>
        <p class="muted">Największe obłożenie: 13:00-15:00. Zaplanuj przerwy w tym oknie.</p>
      </article>

      <section class="stats" aria-label="Podsumowanie zespołu">
        {#each teamStats as stat}
          <article class="stat-card {stat.tone}">
            <p class="stat-label">{stat.label}</p>
            <p class="stat-value">{stat.value}</p>
          </article>
        {/each}
      </section>

      <article class="panel" aria-labelledby="events-title">
        <h2 id="events-title">Ostatnia aktywność</h2>
        <ul class="event-list">
          {#each events as event}
            <li>
              <div>
                <p class="event-person">{event.person}</p>
                <p class="event-action">{event.action}</p>
              </div>
              <time>{event.time}</time>
            </li>
          {/each}
        </ul>
      </article>

      <article class="panel" aria-labelledby="actions-title">
        <h2 id="actions-title">Szybkie akcje</h2>
        <div class="action-grid">
          {#each quickActions as action}
            <button class="secondary" type="button">{action}</button>
          {/each}
        </div>
      </article>
    </div>
  </section>
</main>
