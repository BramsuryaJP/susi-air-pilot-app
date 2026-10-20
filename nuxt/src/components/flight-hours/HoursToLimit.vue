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
    <div class="trend-panel" :aria-busy="status === 'pending'">
      <div class="trend-heading">
        <h3>Flight hours trend</h3>
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
      <div
        v-if="error"
        id="flight-hours-error"
        class="flight-error"
        role="alert"
      >
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
    </div>
  </section>
</template>

<style scoped lang="scss">
.hours-section {
  margin-top: 2rem;
}
.hours-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-bottom: 1rem;
  h2 {
    margin: 0;
    font-size: 1.4rem;
    letter-spacing: -0.035em;
  }
  > span {
    font-size: 0.8rem;
  }
}
.limit-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}
.limit-card {
  background: #fff;
  border: 1px solid #e8ebef;
  border-radius: 12px;
  padding: 1.1rem;
  font-variant-numeric: tabular-nums;
  h3 {
    margin: 0 0 0.8rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #606b7a;
  }
}
.card-value {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 0.2rem;
  margin-bottom: 0.8rem;
  strong {
    font-size: 1.6rem;
    letter-spacing: -0.04em;
  }
  > span {
    white-space: nowrap;
    font-size: 0.8rem;
    color: #606b7a;
  }
}
.limit-meter {
  height: 5px;
  background: #e8ebef;
  border-radius: 4px;
  overflow: hidden;
  > span {
    display: block;
    height: 100%;
    background: #0e2138;
    border-radius: inherit;
  }
}
.card-note {
  margin: 0.6rem 0 0;
  font-size: 0.75rem;
  color: #606b7a;
}
.over-limit {
  .limit-meter > span {
    background: #e63757;
  }
  .card-note {
    color: #bd2442;
    font-weight: 600;
  }
}
.trend-panel {
  min-height: 300px;
  background: #fff;
  border: 1px solid #e8ebef;
  border-radius: 16px;
  padding: clamp(1rem, 3vw, 1.5rem);
  margin-top: 1rem;
}
.trend-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  h3 {
    margin: 0;
    font-size: 1rem;
  }
}
.range-toggle {
  display: flex;
  border: 1px solid #e8ebef;
  padding: 3px;
  border-radius: 999px;
  gap: 2px;
  button {
    border: 0;
    min-width: 40px;
    min-height: 40px;
    padding: 0.4rem 0.6rem;
    background: transparent;
    color: #606b7a;
    border-radius: 999px;
    font-size: 0.8rem;
    &[aria-pressed='true'] {
      background: #0e2138;
      color: #fff;
      font-weight: 700;
    }
  }
}
.chart-placeholder {
  min-height: 260px;
  display: grid;
  place-items: center;
  color: #606b7a;
}
.flight-error {
  padding: 2rem 0;
  p {
    color: #a01935;
  }
}
@media (max-width: 640px) {
  .limit-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .limit-card {
    padding: 1rem;
  }
  .trend-heading {
    flex-direction: column;
    align-items: flex-start;
  }
  .range-toggle {
    width: 100%;
    justify-content: space-between;
    button {
      flex: 1;
    }
  }
}
</style>
