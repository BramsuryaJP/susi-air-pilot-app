<script setup lang="ts">
import type {
  FlightRange,
  FlightSummary,
  LimitKey,
} from '../../../shared/types/flight-hours';

const FlightHoursChart = defineAsyncComponent(
  () => import('./FlightHoursChart.vue'),
);
const flightHours = useFlightHoursStore();
const request = useRequestFetch();
const ranges: FlightRange[] = ['1w', '1m', '3m', '6m', '1y'];
const labels: Record<LimitKey, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  annual: 'Annual',
};
const { data, status, error, refresh } = await useAsyncData(
  'flight-hours-summary',
  (_app, { signal }) =>
    request<FlightSummary>('/api/flight-hours/summary', {
      query: { range: flightHours.range },
      retry: 0,
      signal,
    }),
  { dedupe: 'cancel', deep: false },
);
// Nuxt's watched refresh is debounced behind in-flight work; execute directly
// so a new selection cancels the old request immediately.
watch(
  () => flightHours.range,
  () => {
    void refresh({ dedupe: 'cancel' });
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
</script>

<template>
  <section class="hours-section" aria-labelledby="hours-title">
    <header class="hours-heading">
      <h2 id="hours-title">Hours to limit</h2>
      <span v-if="data" class="muted">As of {{ data.today }}</span>
    </header>
    <div v-if="data" class="limit-grid">
      <article
        v-for="card in data.cards"
        :key="card.key"
        class="limit-card"
        :class="{ 'over-limit': card.overLimit }"
        data-testid="limit-card"
        :data-card="card.key"
      >
        <h3>{{ labels[card.key] }}</h3>
        <p class="card-value">
          <strong data-testid="card-hours">{{ card.hours.toFixed(1) }}</strong
          ><span> / {{ card.limit }} h</span>
        </p>
        <div
          class="limit-meter"
          role="meter"
          :aria-label="`${labels[card.key]} flight hours`"
          aria-valuemin="0"
          :aria-valuemax="Math.max(card.hours, card.limit)"
          :aria-valuenow="card.hours"
          :aria-valuetext="`${card.hours} of ${card.limit} hours${card.overLimit ? ', over limit' : ''}`"
        >
          <span
            :style="{ width: `${Math.min(card.utilizationPercent, 100)}%` }"
          />
        </div>
        <p class="card-note">
          {{
            card.overLimit
              ? 'Over limit'
              : `${card.remainingHours.toFixed(1)} h remaining`
          }}
        </p>
      </article>
    </div>
  </section>
  <section
    class="trend-panel"
    aria-labelledby="trend-title"
    :aria-busy="status === 'pending'"
  >
    <div class="trend-heading">
      <h2 id="trend-title">Flight hours trend</h2>
      <div class="range-toggle" role="group" aria-label="Rolling sum window">
        <button
          v-for="range in ranges"
          :key="range"
          :aria-pressed="flightHours.range === range"
          @click="flightHours.range = range"
        >
          {{ range }}
        </button>
      </div>
    </div>
    <div v-if="error" id="flight-hours-error" class="flight-error" role="alert">
      <p>
        {{
          error.statusCode === 429
            ? 'Too many requests. Try again in a minute.'
            : 'Flight hours could not be loaded. Please try again.'
        }}
      </p>
      <button class="secondary-button" @click="refresh()">Try again</button>
    </div>
    <div
      v-else-if="status === 'pending'"
      class="chart-placeholder"
      role="status"
    >
      Loading flight hours…
    </div>
    <FlightHoursChart v-else-if="data" :summary="data" />
  </section>
</template>

<style scoped lang="scss">
.hours-section {
  min-width: 0;
}
.hours-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-bottom: 0.9rem;
  h2 {
    margin: 0;
    font-size: 1.1rem;
    letter-spacing: -0.025em;
  }
  > span {
    font-size: 0.75rem;
  }
}
.limit-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.9rem;
}
.limit-card {
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.1rem 1.25rem;
  font-variant-numeric: tabular-nums;
  h3 {
    margin: 0 0 0.65rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
  }
}
.card-value {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 0.2rem;
  margin-bottom: 0.85rem;
  strong {
    font-size: 1.8rem;
    font-weight: 800;
    letter-spacing: -0.045em;
    line-height: 1.2;
  }
  > span {
    white-space: nowrap;
    font-size: 0.75rem;
    color: var(--muted);
  }
}
.limit-meter {
  height: 5px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
  > span {
    display: block;
    height: 100%;
    background: var(--navy);
    border-radius: inherit;
  }
}
.card-note {
  margin: 0.6rem 0 0;
  font-size: 0.75rem;
  color: var(--muted);
}
.over-limit {
  border-color: #e6375760;
  .limit-meter > span {
    background: var(--red);
  }
  .card-note {
    color: var(--danger-text);
    font-weight: 600;
  }
}
.trend-panel {
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.5rem;
}
.trend-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.9rem;
  h2 {
    margin: 0;
    font-size: 1.05rem;
    letter-spacing: -0.025em;
  }
}
.range-toggle {
  display: flex;
  background: var(--background);
  padding: 4px;
  border-radius: 999px;
  gap: 4px;
  button {
    border: 0;
    display: grid;
    place-items: center;
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    padding: 0;
    background: transparent;
    color: var(--muted-on-background);
    border-radius: 50%;
    font-size: 0.75rem;
    &[aria-pressed='true'] {
      background: var(--navy);
      color: #fff;
      font-weight: 700;
    }
  }
}
.chart-placeholder {
  min-height: 280px;
  display: grid;
  place-items: center;
  color: var(--muted);
}
.flight-error {
  padding: 2rem 0;
  p {
    color: var(--danger-text);
  }
}
@media (max-width: 640px) {
  .limit-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
  }
  .limit-card {
    padding: 0.9rem;
  }
  .card-value {
    margin-bottom: 0.7rem;
    strong {
      font-size: 1.65rem;
    }
  }
  .trend-panel {
    padding: 1rem;
  }
  .trend-heading {
    flex-direction: column;
    align-items: flex-start;
  }
  .range-toggle {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
