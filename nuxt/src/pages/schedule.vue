<script setup lang="ts">
import ScheduleCalendar from '../components/schedules/ScheduleCalendar.vue';
import WorkspaceHeader from '../components/navigation/WorkspaceHeader.vue';
import type { MonthlySchedule } from '../../shared/types/schedules';
import { parseCalendarMonth, shiftCalendarMonth } from '../utils/calendar';

useHead({ title: 'Schedule | Susi Air' });
const route = useRoute();
const session = useSessionStore();
const selection = useSchedulesStore();
const request = useRequestFetch();
function routeMonth(): string {
  const value = route.query.month ?? session.profile!.today.slice(0, 7);
  const parsed = parseCalendarMonth(value);
  if (!parsed)
    throw createError({
      statusCode: 400,
      statusMessage: 'Choose a valid calendar month.',
    });
  return parsed.key;
}
selection.selectedMonth = routeMonth();
const selected = computed(() => parseCalendarMonth(selection.selectedMonth)!);
const monthLabel = computed(() =>
  new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(
    new Date(Date.UTC(selected.value.year, selected.value.month - 1, 1)),
  ),
);
const previous = computed(() => shiftCalendarMonth(selected.value.key, -1));
const next = computed(() => shiftCalendarMonth(selected.value.key, 1));
const { data, status, error, refresh } = await useAsyncData(
  'schedule-month',
  (_app, { signal }) =>
    request<MonthlySchedule>('/api/schedules', {
      query: { year: selected.value.year, month: selected.value.month },
      signal,
      retry: 0,
    }),
  { deep: false, dedupe: 'cancel' },
);
watch(
  () => route.query.month,
  () => {
    if (route.path === '/schedule') selection.selectedMonth = routeMonth();
  },
);
watch(
  () => selection.selectedMonth,
  () => {
    if (route.path === '/schedule') void refresh({ dedupe: 'cancel' });
  },
);
watch(
  error,
  (failure) => {
    if (failure?.statusCode === 401)
      void navigateTo('/login', { replace: true });
  },
  { immediate: true },
);
function move(month: string | null) {
  if (month) return navigateTo({ path: '/schedule', query: { month } });
}
</script>

<template>
  <main id="main-content" class="workspace-shell schedule-shell" tabindex="-1">
    <WorkspaceHeader />
    <header class="schedule-intro">
      <h1>Schedule</h1>
      <p class="muted">Your duty calendar and logbook status.</p>
    </header>
    <section aria-labelledby="month-title" :aria-busy="status === 'pending'">
      <div class="month-controls">
        <button
          class="secondary-button month-button"
          aria-label="Previous month"
          :disabled="!previous"
          @click="move(previous)"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <h2 id="month-title" aria-live="polite">{{ monthLabel }}</h2>
        <button
          class="secondary-button month-button"
          aria-label="Next month"
          :disabled="!next"
          @click="move(next)"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <div
        v-if="error"
        id="schedule-error"
        class="schedule-message"
        role="alert"
      >
        <p>
          {{
            error.statusCode === 429
              ? 'Too many requests. Try again in a minute.'
              : 'Schedule could not be loaded. Please try again.'
          }}
        </p>
        <button class="secondary-button" @click="refresh()">
          Retry schedule
        </button>
      </div>
      <div
        v-else-if="status === 'pending'"
        class="schedule-message"
        role="status"
      >
        Loading schedule…
      </div>
      <ScheduleCalendar v-else-if="data" :schedule="data" />
    </section>
  </main>
</template>

<style scoped lang="scss">
.schedule-shell {
  width: min(100% - 3rem, 1100px);
}
.schedule-intro {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.4rem 1.5rem;
  margin: 1.75rem 0 1.5rem;
  h1 {
    margin: 0;
    font-size: 1.65rem;
    letter-spacing: -0.04em;
  }
  p {
    margin: 0;
    font-size: 0.85rem;
  }
}
.month-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.4rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  h2 {
    margin: 0;
    font-size: 1.1rem;
    letter-spacing: -0.025em;
  }
}
.month-button {
  min-width: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 1.65rem;
  line-height: 1;
}
.schedule-message {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem 1.5rem;
  color: var(--muted);
}
#schedule-error {
  color: var(--danger-text);
}
@media (min-width: 960px) {
  .month-controls {
    width: calc(100% - 260px - 1.5rem);
  }
}
@media (max-width: 640px) {
  .schedule-shell {
    width: calc(100% - 2rem);
  }
  .schedule-intro {
    margin: 1.25rem 0;
    h1 {
      font-size: 1.5rem;
    }
  }
}
</style>
