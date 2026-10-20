<script setup lang="ts">
import HoursToLimit from '../components/flight-hours/HoursToLimit.vue';
useHead({ title: 'Pilot workspace | Susi Air' });
const session = useSessionStore();
const pending = ref(false);
const errorMessage = ref('');
const hours = computed(() =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(
    session.profile?.totalFlightHours ?? 0,
  ),
);
const today = computed(() =>
  session.profile
    ? new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'long',
        timeZone: 'UTC',
      }).format(new Date(`${session.profile.today}T00:00:00Z`))
    : '',
);

async function signOut() {
  if (pending.value) return;
  pending.value = true;
  errorMessage.value = '';
  try {
    await session.signOut();
    await navigateTo('/login', { replace: true });
  } catch {
    errorMessage.value = 'Sign out could not be completed. Please try again.';
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <main v-if="session.profile" class="workspace-shell">
    <header class="workspace-header">
      <span class="brand-name"
        >Susi Air<span class="brand-dot" aria-hidden="true">.</span></span
      >
      <button class="secondary-button" :disabled="pending" @click="signOut">
        {{ pending ? 'Signing out' : 'Sign out' }}
      </button>
    </header>
    <p v-if="errorMessage" class="error-message" role="alert">
      {{ errorMessage }}
    </p>
    <section class="profile-panel">
      <img :src="session.profile.avatarUrl" alt="" width="64" height="64" >
      <p class="muted">Pilot workspace</p>
      <h1>Welcome, {{ session.profile.name }}</h1>
      <dl class="profile-facts">
        <div>
          <dt>Total flight hours</dt>
          <dd>{{ hours }} <span>hours</span></dd>
        </div>
        <div>
          <dt>Today</dt>
          <dd class="date-value">{{ today }}</dd>
        </div>
      </dl>
    </section>
    <HoursToLimit />
  </main>
</template>
