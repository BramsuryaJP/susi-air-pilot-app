<script setup lang="ts">
import { CalendarDays, Ellipsis, House, NotebookText } from '@lucide/vue';

const route = useRoute();
const schedule = useSchedulesStore();
const scheduleLink = computed(() => ({
  path: '/schedule',
  query: schedule.selectedMonth ? { month: schedule.selectedMonth } : undefined,
}));
const inSchedule = computed(
  () => route.name === 'schedule' || route.name === 'duty-date',
);
</script>

<template>
  <nav class="bottom-navigation" aria-label="Main navigation">
    <NuxtLink
      to="/"
      :prefetch="false"
      :aria-current="route.name === 'index' ? 'page' : undefined"
      :class="{ active: route.name === 'index' }"
    >
      <House :stroke-width="1.7" aria-hidden="true" focusable="false" />
      <span>Home</span>
    </NuxtLink>
    <NuxtLink
      :to="scheduleLink"
      :prefetch="false"
      :aria-current="inSchedule ? 'page' : undefined"
      :class="{ active: inSchedule }"
    >
      <CalendarDays :stroke-width="1.7" aria-hidden="true" focusable="false" />
      <span>Schedule</span>
    </NuxtLink>
    <NuxtLink
      to="/logbook"
      :prefetch="false"
      :aria-current="route.name === 'logbook' ? 'page' : undefined"
      :class="{ active: route.name === 'logbook' }"
    >
      <NotebookText :stroke-width="1.7" aria-hidden="true" focusable="false" />
      <span>Logbook</span>
    </NuxtLink>
    <NuxtLink
      to="/more"
      :prefetch="false"
      :aria-current="route.name === 'more' ? 'page' : undefined"
      :class="{ active: route.name === 'more' }"
    >
      <Ellipsis :stroke-width="1.7" aria-hidden="true" focusable="false" />
      <span>More</span>
    </NuxtLink>
  </nav>
</template>

<style scoped lang="scss">
.bottom-navigation {
  position: fixed;
  inset: auto 0 0;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  max-width: 460px;
  margin: 0 auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-bottom: 0;
  padding: 0.5rem 0.5rem calc(0.5rem + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    min-height: 60px;
    border: 0;
    border-radius: 10px;
    color: var(--muted);
    background: none;
    text-decoration: none;
    font-size: 0.8125rem;
    font-weight: 600;
  }
  svg {
    width: 24px;
    height: 24px;
  }
  a.active {
    background: var(--danger-surface);
    color: var(--danger-text);
    font-weight: 700;
  }
  a:hover:not(.active) {
    background: var(--background);
  }
}
@media (min-width: 768px) {
  .bottom-navigation {
    bottom: 1rem;
    padding: 0.4rem;
    border-bottom: 1px solid var(--border);
    border-radius: 18px;
    box-shadow: 0 8px 32px #0e213812;
    a {
      gap: 0.2rem;
      min-height: 48px;
      font-size: 0.7rem;
      font-weight: 400;
    }
    svg {
      width: 21px;
      height: 21px;
    }
  }
}
</style>
