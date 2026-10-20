<script setup lang="ts">
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
</script>

<template>
  <main class="workspace-shell duty-detail">
    <NuxtLink
      :to="{ path: '/schedule', query: { month: date.slice(0, 7) } }"
      :prefetch="false"
      class="back-link"
      >Back to schedule</NuxtLink
    >
    <section class="profile-panel">
      <p class="muted">
        <time :datetime="date">{{ formatted }}</time>
      </p>
      <h1>Detail page coming soon</h1>
      <p class="muted">Duty details will be available here.</p>
    </section>
  </main>
</template>

<style scoped lang="scss">
.duty-detail {
  padding-top: 2rem;
}
.back-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: #0e2138;
  margin-bottom: 1rem;
}
h1 {
  font-size: clamp(1.5rem, 5vw, 2rem);
  letter-spacing: -0.04em;
}
</style>
