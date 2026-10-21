<script setup lang="ts">
import WorkspaceHeader from './WorkspaceHeader.vue';

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
    <section class="unavailable-panel" aria-labelledby="unavailable-title">
      <p class="muted">{{ section }}</p>
      <h1 id="unavailable-title">Page unavailable</h1>
      <p class="muted">This page is not available yet.</p>
      <NuxtLink class="home-link" to="/" :prefetch="false"
        >Back to Home</NuxtLink
      >
    </section>
  </main>
</template>

<style scoped lang="scss">
.unavailable-shell {
  width: min(100% - 3rem, 1100px);
}
.unavailable-panel {
  max-width: 640px;
  margin: clamp(2rem, 7vh, 4.5rem) auto 0;
  padding: clamp(1.5rem, 5vw, 3rem);
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  h1 {
    margin-bottom: 1rem;
    font-size: clamp(1.75rem, 3vw, 2.25rem);
    letter-spacing: -0.04em;
  }
  > p:first-child {
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }
}
.home-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  margin-top: 0.75rem;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  background: var(--red);
  color: var(--surface);
  font-size: 1.2rem;
  font-weight: 700;
  text-decoration: none;
  &:hover {
    background: #c92343;
  }
}
@media (max-width: 640px) {
  .unavailable-shell {
    width: calc(100% - 2rem);
  }
  .home-link {
    width: 100%;
  }
}
</style>
