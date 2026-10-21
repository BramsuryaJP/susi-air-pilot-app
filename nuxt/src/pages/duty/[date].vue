<script setup lang="ts">
import WorkspaceHeader from '../../components/navigation/WorkspaceHeader.vue';
import StatusPanel from '../../components/navigation/StatusPanel.vue';
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
    <StatusPanel aria-labelledby="detail-heading">
      <h1 id="detail-heading">Detail page coming soon</h1>
      <p class="status-description">
        Duty details for this date aren’t available yet. You can still
        review your duties in the monthly schedule.
      </p>
      <NuxtLink
        :to="{ path: '/schedule', query: { month: date.slice(0, 7) } }"
        :prefetch="false"
        class="status-return primary-button"
        >Back to schedule</NuxtLink
      >
      <template #illustration>
        <time
          class="duty-date"
          :datetime="date"
          :aria-label="`${weekday}, ${formatted}`"
        >
          <span class="date-month">{{ monthYear }}</span>
          <span class="date-day">{{ day }}</span>
          <span class="date-weekday">{{ weekday }}</span>
        </time>
      </template>
    </StatusPanel>
  </main>
</template>

<style scoped lang="scss">
.duty-detail {
  display: grid;
  gap: 1.5rem;
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
</style>
