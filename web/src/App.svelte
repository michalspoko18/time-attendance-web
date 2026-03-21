<script lang="ts">
  let email = '';
  let password = '';
  let loading = false;
  let error = '';
  let success = '';

  const API_BASE = import.meta.env.VITE_API_URL ?? '';

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
      const response = await fetch(`${API_BASE}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        error = data.detail ?? 'Nie udało się zalogować.';
        return;
      }

      if (data?.access) {
        localStorage.setItem('accessToken', data.access);
      }

      success = 'Logowanie zakończone sukcesem.';
    } catch {
      error = 'Błąd połączenia z API.';
    } finally {
      loading = false;
    }
  }
</script>

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
