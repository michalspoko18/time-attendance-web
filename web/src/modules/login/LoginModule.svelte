<script lang="ts">
  import axios from 'axios';
  import { createEventDispatcher } from 'svelte';
  import heroImage from '../../assets/hero.png';
  import { api } from '../../lib/api';
  import { setAccessToken } from '../../lib/auth';

  const dispatch = createEventDispatcher<{ loginSuccess: void }>();

  export let loginError = '';

  let email = '';
  let password = '';
  let loading = false;
  let error = '';
  let lastLoginError = '';

  $: if (loginError && loginError !== lastLoginError) {
    error = loginError;
    lastLoginError = loginError;
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    error = '';

    if (!email.trim() || !password.trim()) {
      error = 'Uzupełnij email i hasło.';
      return;
    }

    loading = true;

    try {
      const response = await api.post('/api/auth/login/', {
        email: email.trim(),
        password
      });
      const data = response.data ?? {};

      if (!data?.access) {
        error = 'Brak tokenu dostępu w odpowiedzi.';
        return;
      }

      setAccessToken(data.access);
      dispatch('loginSuccess');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        error = err.response?.data?.detail ?? 'Nie udało się zalogować.';
      } else {
        error = 'Błąd połączenia z API.';
      }
    } finally {
      loading = false;
    }
  }
</script>

<main class="login-page">
  <section class="login-shell" aria-labelledby="login-title">
    <aside class="login-brand">
      <p class="eyebrow">Time Attendance</p>
      <h1 class="brand-title">Lepsza kontrola czasu pracy</h1>
      <p class="brand-copy">
        Monitoruj obecność, analizuj trendy i obsługuj grafik zespołu w jednym miejscu.
      </p>
      <img src={heroImage} alt="Ilustracja panelu pracy" class="brand-art" />
    </aside>

    <article class="login-card">
      <p class="eyebrow">Welcome back</p>
      <h2 id="login-title">Zaloguj się</h2>
      <p class="subtitle">Użyj danych konta, aby przejść do panelu.</p>

      <form class="form" on:submit={handleSubmit}>
        <label for="email">Adres email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="m@example.com"
          autocomplete="email"
          required
        />

        <label for="password">Hasło</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="Wpisz hasło"
          autocomplete="current-password"
          required
        />

        {#if error}
          <p class="feedback error" role="alert">{error}</p>
        {/if}

        <button type="submit" disabled={loading}>
          {#if loading}Trwa logowanie...{:else}Przejdź do panelu{/if}
        </button>
      </form>
    </article>
  </section>
</main>
