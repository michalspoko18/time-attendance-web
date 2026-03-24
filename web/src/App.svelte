<script lang="ts">
  import axios from 'axios';
  import { api } from './lib/api';

  let email = '';
  let password = '';
  let loading = false;
  let error = '';
  let success = '';
  let isAuthenticated = Boolean(localStorage.getItem('accessToken'));

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    error = '';
    success = '';

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

      if (data?.access) {
        localStorage.setItem('accessToken', data.access);
      }

      success = 'Logowanie zakończone sukcesem.';
      isAuthenticated = true;
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

{#if isAuthenticated}
  <main class="dashboard-page">
    <section class="dashboard-card" aria-labelledby="dashboard-title">
      <h1 id="dashboard-title">Dashboard</h1>
    </section>
  </main>
{:else}
  <main class="login-page">
    <section class="login-card" aria-labelledby="login-title">
      <h1 id="login-title">Sign in</h1>
      <p class="subtitle">Sign in to your account</p>

      <form class="form" on:submit={handleSubmit}>
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="m@example.com"
          autocomplete="email"
          required
        />

        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="******"
          autocomplete="current-password"
          required
        />

        {#if error}
          <p class="feedback error" role="alert">{error}</p>
        {/if}

        {#if success}
          <p class="feedback success" role="status">{success}</p>
        {/if}

        <button type="submit" disabled={loading}>
          {#if loading}Signing in...{:else}Continue{/if}
        </button>
      </form>
    </section>
  </main>
{/if}
