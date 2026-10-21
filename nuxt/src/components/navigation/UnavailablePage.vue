<script setup lang="ts">
import WorkspaceHeader from './WorkspaceHeader.vue';
import StatusPanel from './StatusPanel.vue';
import StatusIllustration from './StatusIllustration.vue';

const props = defineProps<{ section: 'Logbook' | 'More' }>();
if (import.meta.server) {
  useResponseHeader('Cache-Control').value = 'private, no-store';
  useResponseHeader('Vary').value = 'Cookie';
}
useHead(() => ({
  title: `${props.section} | Susi Air`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
}));
</script>

<template>
  <main
    id="main-content"
    class="workspace-shell unavailable-shell"
    tabindex="-1"
  >
    <WorkspaceHeader />
    <StatusPanel aria-labelledby="unavailable-title">
      <p class="page-context">{{ section }}</p>
      <h1 id="unavailable-title">Page unavailable</h1>
      <p class="status-description">This page is not available yet.</p>
      <NuxtLink class="status-return primary-button" to="/" :prefetch="false"
        >Back to Home</NuxtLink
      >
      <template #illustration><StatusIllustration /></template>
    </StatusPanel>
  </main>
</template>

<style scoped lang="scss">
.unavailable-shell {
  display: grid;
  gap: 1.5rem;
}
.page-context {
  color: var(--muted-on-background);
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}
</style>
