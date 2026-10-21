<script setup lang="ts">
import type { NuxtError } from '#app';
import WorkspaceHeader from './components/navigation/WorkspaceHeader.vue';

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
      <section class="error-panel" aria-labelledby="error-title">
        <p class="error-code">{{ error.statusCode }}</p>
        <div class="error-copy">
          <h1 id="error-title">{{ title }}</h1>
          <p class="muted">
            {{
              isNotFound
                ? 'We couldn’t find that page. Check the address or return to your pilot workspace.'
                : 'We couldn’t load this page. Return to your pilot workspace, or try again later.'
            }}
          </p>
          <!-- A fresh document restores session validation outside the failed router context. -->
          <a class="home-link" href="/"
            >Back to Home <span aria-hidden="true">→</span></a
          >
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.error-shell {
  width: min(100% - 2.5rem, 1100px);
  min-height: 100svh;
  margin: auto;
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
}
.error-content {
  flex: 1;
  display: grid;
  align-content: center;
  padding: 3rem 0;
}
.error-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(2rem, 6vw, 5rem);
  padding: clamp(1.5rem, 5vw, 4rem);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
}
.error-code {
  margin: 0;
  color: var(--navy);
  font-size: clamp(5rem, 10vw, 8rem);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  line-height: 1;
}
.error-copy {
  max-width: 32rem;
  h1 {
    margin-bottom: 1rem;
    font-size: clamp(1.65rem, 3vw, 2.25rem);
    letter-spacing: -0.04em;
  }
  p {
    margin-bottom: 1.75rem;
  }
}
.home-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  min-height: 52px;
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
  .error-shell {
    width: calc(100% - 2rem);
    padding-top: 1rem;
  }
  .error-content {
    padding: 2rem 0;
  }
  .error-panel {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }
  .home-link {
    width: 100%;
  }
}
</style>
