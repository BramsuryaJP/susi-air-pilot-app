<script setup lang="ts">
const route = useRoute();
const schedule = useSchedulesStore();
const scheduleLink = computed(() => ({
  path: '/schedule',
  query: schedule.selectedMonth ? { month: schedule.selectedMonth } : undefined,
}));
const inSchedule = computed(
  () => route.path === '/schedule' || route.path.startsWith('/duty/'),
);
</script>

<template>
  <nav class="bottom-navigation" aria-label="Main navigation">
    <NuxtLink
      to="/"
      :prefetch="false"
      :aria-current="route.path === '/' ? 'page' : undefined"
      :class="{ active: route.path === '/' }"
      ><svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        aria-hidden="true"
      >
        <path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7" /></svg
      ><span>Home</span></NuxtLink
    >
    <NuxtLink
      :to="scheduleLink"
      :prefetch="false"
      :aria-current="inSchedule ? 'page' : undefined"
      :class="{ active: inSchedule }"
      ><svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 2v6m10-6v6M3 11h18m-13 4h2m4 0h2" /></svg
      ><span>Schedule</span></NuxtLink
    >
    <button type="button" disabled aria-label="Logbook (coming soon)">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        aria-hidden="true"
      >
        <path d="M5 3h14v18H5zM9 7h6M9 11h6M9 15h4" /></svg
      ><span>Logbook</span>
    </button>
    <button type="button" disabled aria-label="More (coming soon)">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        aria-hidden="true"
      >
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" /></svg
      ><span>More</span>
    </button>
  </nav>
</template>

<style scoped lang="scss">
.bottom-navigation {
  position: fixed;
  inset: auto 0 0;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  max-width: 940px;
  margin: 0 auto;
  background: white;
  border: 1px solid #e8ebef;
  border-bottom: 0;
  padding: 0.5rem 0.5rem calc(0.5rem + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
  a,
  button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    min-height: 48px;
    border: 0;
    border-radius: 8px;
    color: #606b7a;
    background: none;
    text-decoration: none;
    font-size: 0.7rem;
  }
  button:disabled {
    cursor: default;
    opacity: 0.5;
  }
  svg {
    width: 22px;
    height: 22px;
  }
  a.active {
    color: #e63757;
    font-weight: 700;
  }
  a:hover {
    background: #f5f6f8;
  }
}
</style>
