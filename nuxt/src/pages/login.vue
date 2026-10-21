<script setup lang="ts">
useHead({ title: 'Sign in | Susi Air' });
const session = useSessionStore();
const username = ref('');
const password = ref('');
const ready = ref(false);
const pending = ref(false);
const errorMessage = ref('');
const revealPassword = ref(false);

onMounted(() => {
  ready.value = true;
});

async function signIn() {
  if (!ready.value || pending.value) return;
  pending.value = true;
  errorMessage.value = '';
  try {
    await session.signIn({
      username: username.value,
      password: password.value,
    });
    password.value = '';
    await navigateTo('/', { replace: true });
  } catch (error: unknown) {
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? error.statusCode
        : undefined;
    errorMessage.value =
      status === 401
        ? 'Invalid username or password.'
        : status === 429
          ? 'Too many sign-in attempts. Try again in a minute.'
          : status === 400
            ? 'Check your username and password.'
            : 'The sign-in service is unavailable. Please try again.';
    password.value = '';
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <main id="main-content" class="sign-in-shell" tabindex="-1">
    <header class="brand-header">
      <BrandMark />
      <span>Pilot workspace</span>
    </header>
    <section class="sign-in-panel" aria-labelledby="sign-in-title">
      <div class="intro">
        <span class="intro-rule" aria-hidden="true" />
        <h1 id="sign-in-title">Ready for<br >your next flight.</h1>
        <p>Sign in to your pilot workspace.</p>
      </div>
      <form
        class="sign-in-form"
        method="post"
        action="/api/auth/login"
        :aria-busy="!ready || pending"
        @submit.prevent="signIn"
      >
        <h2>Welcome back</h2>
        <p class="muted" role="status">
          {{ ready ? 'Enter your pilot account details.' : 'Enable JavaScript to sign in.' }}
        </p>
        <p v-if="session.expired" class="session-notice" role="alert">
          Session expired. Please sign in again.
        </p>
        <div
          v-if="errorMessage"
          id="sign-in-error"
          class="error-message"
          role="alert"
        >
          {{ errorMessage }}
        </div>
        <label for="username">Username</label>
        <input
          id="username"
          v-model="username"
          :disabled="!ready || pending"
          name="username"
          autocomplete="username"
          required
          maxlength="64"
          autocapitalize="none"
          spellcheck="false"
          :aria-describedby="errorMessage ? 'sign-in-error' : undefined"
          :aria-invalid="!!errorMessage"
        >
        <label for="password">Password</label>
        <div class="password-field">
          <input
            id="password"
            v-model="password"
            :disabled="!ready || pending"
            name="password"
            :type="revealPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
            maxlength="128"
            :aria-describedby="errorMessage ? 'sign-in-error' : undefined"
            :aria-invalid="!!errorMessage"
          >
          <button
            type="button"
            class="password-toggle"
            :disabled="!ready || pending"
            :aria-label="revealPassword ? 'Hide password' : 'Show password'"
            :aria-pressed="revealPassword"
            @click="revealPassword = !revealPassword"
          >
            {{ revealPassword ? 'Hide' : 'Show' }}
          </button>
        </div>
        <button class="primary-button" type="submit" :disabled="!ready || pending">
          {{ pending ? 'Signing in' : 'Sign in' }}
        </button>
      </form>
    </section>
    <footer class="sign-in-footer">PT. ASI Pudjiastuti Aviation</footer>
  </main>
</template>

<style scoped lang="scss">
.session-notice {
  padding: 0.875rem 1rem;
  margin-bottom: 1.25rem;
  border: 1px solid #f4dcad;
  border-radius: 10px;
  color: var(--warning-text);
  background: var(--warning-surface);
  font-size: 0.875rem;
}
</style>
