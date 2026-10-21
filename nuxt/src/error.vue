<script setup lang="ts">
import type { NuxtError } from '#app';
import WorkspaceHeader from './components/navigation/WorkspaceHeader.vue';
import StatusPanel from './components/navigation/StatusPanel.vue';
import StatusIllustration from './components/navigation/StatusIllustration.vue';

const props = defineProps<{ error: NuxtError }>();
const content = ref<HTMLElement | null>(null);
const isNotFound = computed(() => props.error.statusCode === 404);
const title = computed(() =>
  isNotFound.value ? 'Page not found' : 'Unable to load this page',
);

useHead(() => ({
  title: `${title.value} | Susi Air`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
}));
</script>

<template>
  <div class="error-shell">
    <a class="skip-link" href="#main-content" @click.prevent="content?.focus()"
      >Skip to main content</a
    >
    <WorkspaceHeader />
    <main id="main-content" ref="content" class="error-content" tabindex="-1">
      <StatusPanel aria-labelledby="error-title">
        <p class="error-code">Error {{ error.statusCode }}</p>
        <h1 id="error-title">{{ title }}</h1>
        <p class="status-description">
          {{
            isNotFound
              ? 'We couldn’t find that page. Check the address or return to your pilot workspace.'
              : 'We couldn’t load this page. Return to your pilot workspace, or try again later.'
          }}
        </p>
        <!-- A fresh document restores session validation outside the failed router context. -->
        <a class="status-return primary-button" href="/">Back to Home</a>
        <template #illustration>
          <StatusIllustration :code="error.statusCode" />
        </template>
      </StatusPanel>
    </main>
  </div>
</template>

<style scoped lang="scss">
.error-shell {
  width: min(100% - 2.5rem, 900px);
  min-height: 100svh;
  margin: auto;
  padding: 1.5rem 0;
}
.error-content {
  padding-top: 1.5rem;
}
.error-code {
  margin: 0 0 0.75rem;
  color: var(--danger-text);
  font-size: 0.85rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
@media (max-width: 640px) {
  .error-shell {
    width: calc(100% - 2rem);
    padding-top: 1rem;
  }
}
</style>
