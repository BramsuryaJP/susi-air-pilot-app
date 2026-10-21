<script setup lang="ts">
import HoursToLimit from '../components/flight-hours/HoursToLimit.vue';
import WorkspaceHeader from '../components/navigation/WorkspaceHeader.vue';
const MyDocuments = defineAsyncComponent(
  () => import('../components/documents/MyDocuments.vue'),
);
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
  <main
    v-if="session.profile"
    id="main-content"
    class="workspace-shell dashboard-shell"
    tabindex="-1"
  >
    <WorkspaceHeader>
      <template #actions>
        <button class="secondary-button" :disabled="pending" @click="signOut">
          {{ pending ? 'Signing out' : 'Sign out' }}
        </button>
      </template>
    </WorkspaceHeader>
    <p v-if="errorMessage" class="error-message" role="alert">
      {{ errorMessage }}
    </p>
    <section
      class="profile-panel pilot-overview"
      aria-labelledby="pilot-greeting"
    >
      <div class="pilot-identity">
        <img :src="session.profile.avatarUrl" alt="" width="48" height="48" />
        <h1 id="pilot-greeting">Welcome, {{ session.profile.name }}</h1>
      </div>
      <dl class="pilot-facts">
        <div>
          <dt>Total flight hours</dt>
          <dd>{{ hours }} <span>hours</span></dd>
        </div>
        <div>
          <dt>Today</dt>
          <dd class="date-value">
            <time :datetime="session.profile.today">{{ today }}</time>
          </dd>
        </div>
      </dl>
    </section>
    <div class="dashboard-grid">
      <HoursToLimit />
      <MyDocuments />
    </div>
  </main>
</template>

<style scoped lang="scss">
.dashboard-shell {
  width: min(100% - 3rem, 1160px);
}
.pilot-overview {
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem 2rem;
  padding: 1.75rem 0;
}
.pilot-identity {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
  img {
    border-radius: 50%;
    flex: 0 0 48px;
  }
  h1 {
    margin: 0;
    font-size: clamp(1.25rem, 2.4vw, 1.65rem);
    letter-spacing: -0.035em;
  }
}
.pilot-facts {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 0 0 auto;
  margin: 0;
  > div + div {
    border-left: 1px solid var(--border);
    padding-left: 2rem;
  }
  dt {
    font-size: 0.75rem;
  }
  dd {
    margin: 0.2rem 0 0;
    font-size: 1.65rem;
    line-height: 1.3;
    font-weight: 800;
    letter-spacing: -0.035em;
    font-variant-numeric: tabular-nums;
    span {
      font-size: 0.75rem;
      font-weight: 400;
      color: var(--muted);
      letter-spacing: 0;
    }
  }
  .date-value {
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0;
  }
}
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
  :deep(.hours-section) {
    grid-column: 1 / -1;
  }
}
@media (max-width: 1023px) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .pilot-overview {
    align-items: flex-start;
    flex-direction: column;
    gap: 1rem;
  }
  .pilot-facts {
    width: 100%;
    gap: 1.5rem;
  }
  .pilot-facts > div + div {
    padding-left: 1.5rem;
  }
}
@media (max-width: 640px) {
  .dashboard-shell {
    width: calc(100% - 2rem);
  }
  .pilot-overview {
    padding: 1.25rem 0 1.5rem;
  }
  .pilot-identity h1 {
    font-size: 1.25rem;
  }
  .pilot-facts {
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
    gap: 0.75rem;
    > div + div {
      border-left: 0;
      padding-left: 0;
      text-align: right;
    }
    dd {
      font-size: 1.5rem;
    }
    .date-value {
      font-size: 0.8rem;
      line-height: 1.8;
    }
  }
  .dashboard-grid {
    gap: 1.25rem;
  }
}
</style>
