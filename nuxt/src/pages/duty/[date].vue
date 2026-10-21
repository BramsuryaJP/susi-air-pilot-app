<script setup lang="ts">
import WorkspaceHeader from '../../components/navigation/WorkspaceHeader.vue';
useHead({ title: 'Duty detail | Susi Air' });
const route = useRoute();
const date = typeof route.params.date === 'string' ? route.params.date : '';
const stamp = Date.parse(`${date}T00:00:00Z`);
if (
  !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(date) ||
  !Number.isFinite(stamp) ||
  new Date(stamp).toISOString().slice(0, 10) !== date
) {
  throw createError({ statusCode: 404, statusMessage: 'Duty date not found.' });
}
const selection = useSchedulesStore();
selection.selectedMonth = date.slice(0, 7);
const formatted = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  timeZone: 'UTC',
}).format(new Date(stamp));
const weekday = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  timeZone: 'UTC',
}).format(new Date(stamp));
const monthYear = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(stamp));
const day = new Date(stamp).getUTCDate();
</script>

<template>
  <main id="main-content" class="workspace-shell duty-detail" tabindex="-1">
    <WorkspaceHeader />
    <section class="detail-panel" aria-labelledby="detail-heading">
      <div class="date-panel">
        <time
          class="duty-date"
          :datetime="date"
          :aria-label="`${weekday}, ${formatted}`"
        >
          <span class="date-month">{{ monthYear }}</span>
          <span class="date-day">{{ day }}</span>
          <span class="date-weekday">{{ weekday }}</span>
        </time>
      </div>
      <div class="detail-message">
        <h1 id="detail-heading">Detail page coming soon</h1>
        <p>
          Duty details for this date aren’t available yet. You can still
          review your duties in the monthly schedule.
        </p>
        <NuxtLink
          :to="{ path: '/schedule', query: { month: date.slice(0, 7) } }"
          :prefetch="false"
          class="back-link"
          >Back to schedule</NuxtLink
        >
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
.duty-detail {
  display: grid;
  gap: 1.5rem;
}
.detail-panel {
  display: grid;
  grid-template-columns: minmax(12rem, 1fr) minmax(0, 2fr);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
}
.date-panel {
  display: grid;
  place-items: center;
  padding: 2.5rem 1.5rem;
  border-right: 1px solid var(--border);
  border-radius: 15px 0 0 15px;
  background: var(--background);
}
.duty-date {
  display: grid;
  width: 9rem;
  text-align: center;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
.date-month {
  padding: 0.65rem 0.5rem;
  border-radius: 11px 11px 0 0;
  background: var(--navy);
  color: var(--surface);
  font-size: 0.85rem;
  font-weight: 600;
}
.date-day {
  padding: 0.75rem 0.5rem 0;
  font-size: 4rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.055em;
  font-variant-numeric: tabular-nums;
}
.date-weekday {
  padding: 0.2rem 0.5rem 1rem;
  color: var(--muted-on-background);
  font-size: 0.85rem;
}
.detail-message {
  align-self: center;
  padding: clamp(1.5rem, 4vw, 3rem);
  h1 {
    margin-bottom: 1rem;
    max-width: 17ch;
    font-size: clamp(1.5rem, 3vw, 2rem);
    letter-spacing: -0.04em;
  }
  p {
    margin-bottom: 1.75rem;
    max-width: 42ch;
    color: var(--muted-on-background);
    font-size: 0.95rem;
  }
}
.back-link {
  --focus-color: var(--surface);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  background: var(--navy);
  color: var(--surface);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  &:hover {
    background: #203b59;
  }
}
@media (max-width: 640px) {
  .detail-panel {
    grid-template-columns: minmax(0, 1fr);
  }
  .date-panel {
    padding: 1.5rem;
    border-right: 0;
    border-bottom: 1px solid var(--border);
    border-radius: 15px 15px 0 0;
  }
  .detail-message {
    h1 {
      max-width: none;
    }
  }
  .back-link {
    width: 100%;
  }
}
</style>
