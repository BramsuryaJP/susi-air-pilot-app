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
        <div class="error-copy">
          <p class="error-code">Error {{ error.statusCode }}</p>
          <h1 id="error-title">{{ title }}</h1>
          <p class="muted">
            {{
              isNotFound
                ? 'We couldn’t find that page. Check the address or return to your pilot workspace.'
                : 'We couldn’t load this page. Return to your pilot workspace, or try again later.'
            }}
          </p>
          <!-- A fresh document restores session validation outside the failed router context. -->
          <a class="home-link" href="/">Back to Home</a>
        </div>
        <div class="error-illustration" aria-hidden="true">
          <svg viewBox="0 0 420 360" fill="none">
            <defs>
              <pattern
                id="flight-grid"
                width="30"
                height="30"
                patternUnits="userSpaceOnUse"
              >
                <path d="M30 0H0V30" stroke="#d3dce8" stroke-opacity=".12" />
              </pattern>
            </defs>
            <path fill="url(#flight-grid)" d="M0 0h420v360H0z" />
            <circle
              cx="210"
              cy="180"
              r="130"
              stroke="#d3dce8"
              stroke-opacity=".12"
            />
            <circle
              cx="210"
              cy="180"
              r="90"
              stroke="#d3dce8"
              stroke-opacity=".12"
            />
            <text
              x="210"
              y="161"
              text-anchor="middle"
              fill="#fff"
              font-size="96"
              font-weight="800"
              letter-spacing="-4"
            >
              {{ error.statusCode }}
            </text>
            <path
              d="M52 280C115 280 114 221 178 221S279 267 324 180C344 141 355 107 366 73"
              stroke="#d3dce8"
              stroke-width="2"
              stroke-dasharray="5 7"
            />
            <circle cx="52" cy="280" r="6" fill="#fff" />
            <circle
              cx="366"
              cy="73"
              r="13"
              fill="#0e2138"
              stroke="#e63757"
              stroke-width="2"
            />
            <path
              d="m362 69 8 8m0-8-8 8"
              stroke="#e63757"
              stroke-width="2"
              stroke-linecap="round"
            />
            <g transform="translate(243 230) rotate(58)">
              <circle r="43" fill="#0e2138" />
              <path
                d="M-4-31h8l4 21L30 5v7L7 3 5 23l10 8v5L0 31l-15 5v-5l10-8-2-20-23 9V5l22-15z"
                fill="#fff"
              />
              <path d="M-4-31h8l2 10H-6z" fill="#e63757" />
            </g>
          </svg>
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
  align-content: start;
  padding: clamp(2rem, 7vh, 4.5rem) 0;
}
.error-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
}
.error-code {
  margin: 0 0 1rem;
  color: var(--danger-text);
  font-size: 0.85rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.error-copy {
  align-self: center;
  padding: clamp(1.5rem, 4vw, 3.5rem);
  h1 {
    margin-bottom: 1rem;
    font-size: clamp(1.9rem, 3.5vw, 2.8rem);
    letter-spacing: -0.04em;
  }
  p {
    margin-bottom: 1.75rem;
  }
  .muted {
    max-width: 35ch;
  }
}
.error-illustration {
  display: grid;
  align-content: center;
  min-height: 360px;
  background: var(--navy);
  svg {
    display: block;
    width: 100%;
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
  }
  .error-illustration {
    min-height: 0;
    svg {
      max-height: 230px;
    }
  }
  .home-link {
    width: 100%;
  }
}
</style>
