<script setup lang="ts">
import { RefreshCw } from '@lucide/vue';
import type {
  DocumentStatus,
  PilotDocument,
  PilotDocuments,
} from '../../../shared/types/documents';

const request = useRequestFetch();
const { data, status, error, refresh } = await useAsyncData(
  'pilot-documents',
  (_app, { signal }) =>
    request<PilotDocuments>('/api/documents', { retry: 0, signal }),
  { deep: false, dedupe: 'defer' },
);
const statusLabels: Record<DocumentStatus, string> = {
  safe: 'Valid',
  soon: 'Due soon',
  expired: 'Expired',
};
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const formatDate = (date: string) =>
  dateFormatter.format(new Date(`${date}T00:00:00Z`));
function expiryDescription(document: PilotDocument): string {
  const days = Math.abs(document.daysRemaining);
  const duration = `${days} ${days === 1 ? 'day' : 'days'}`;
  if (document.status === 'expired')
    return document.daysRemaining === 0
      ? 'Expired today'
      : `Expired ${duration} ago`;
  return `Expires in ${duration}`;
}
watch(
  error,
  (failure) => {
    if (failure?.statusCode === 401)
      void navigateTo('/login', { replace: true });
  },
  { immediate: true },
);
</script>

<template>
  <section
    class="documents-section"
    aria-labelledby="documents-title"
    :aria-busy="status === 'pending'"
  >
    <header class="documents-heading">
      <h2 id="documents-title">My documents</h2>
      <button
        class="documents-refresh secondary-button"
        :disabled="status === 'pending'"
        :aria-label="
          status === 'pending' ? 'Refreshing documents' : 'Refresh documents'
        "
        @click="refresh()"
      >
        <RefreshCw
          :stroke-width="1.7"
          aria-hidden="true"
          focusable="false"
        />
        {{ status === 'pending' ? 'Refreshing' : 'Refresh' }}
      </button>
    </header>
    <p v-if="data" class="documents-as-of muted">
      Status as of
      <time :datetime="data.today">{{ formatDate(data.today) }}</time>
    </p>
    <div
      v-if="error"
      id="documents-error"
      class="documents-message"
      role="alert"
    >
      <p>
        {{
          error.statusCode === 429
            ? 'Too many requests. Try again in a minute.'
            : 'Documents could not be loaded. Please try again.'
        }}
      </p>
      <button class="secondary-button" @click="refresh()">
        Retry documents
      </button>
    </div>
    <p v-else-if="status === 'pending'" class="documents-message" role="status">
      Loading documents…
    </p>
    <ul v-else-if="data?.documents.length" class="documents-list">
      <li
        v-for="document in data.documents"
        :key="document.id"
        :data-document-id="document.id"
      >
        <div class="document-details">
          <h3>{{ document.label }}</h3>
          <p>
            <time :datetime="document.expiryDate">{{
              formatDate(document.expiryDate)
            }}</time
            ><span>{{ expiryDescription(document) }}</span>
          </p>
        </div>
        <span
          class="expiry-badge"
          :class="`expiry-${document.status}`"
          :data-status="document.status"
          data-testid="expiry-badge"
        >
          <span class="status-dot" aria-hidden="true" />{{
            statusLabels[document.status]
          }}
        </span>
      </li>
    </ul>
    <p v-else class="documents-message">No documents are available.</p>
  </section>
</template>

<style scoped lang="scss">
.documents-section {
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem;
}
.documents-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  h2 {
    margin: 0;
    font-size: 1.05rem;
    letter-spacing: -0.025em;
  }
}
.documents-refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  padding: 0.45rem 0.65rem;
  border-color: var(--border);
  svg {
    width: 15px;
    height: 15px;
  }
}
.documents-as-of {
  font-size: 0.75rem;
  margin: 0.35rem 0 1rem;
}
.documents-list {
  list-style: none;
  padding: 0;
  margin: 0;
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 0.6rem 0.75rem;
    padding: 1rem 0;
    border-top: 1px solid var(--border);
    &:last-child {
      padding-bottom: 0;
    }
  }
}
.document-details {
  min-width: 0;
  h3 {
    margin: 0 0 0.45rem;
    font-size: 0.85rem;
    line-height: 1.45;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  p {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    margin: 0;
    font-size: 0.75rem;
    color: var(--muted);
  }
  time {
    color: var(--navy);
    font-variant-numeric: tabular-nums;
  }
}
.expiry-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  justify-self: start;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  line-height: 1.6;
  font-weight: 600;
  white-space: nowrap;
}
.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--status-color, currentColor);
}
.expiry-safe {
  --status-color: var(--success);
  color: var(--success-text);
  background: var(--success-surface);
}
.expiry-soon {
  --status-color: var(--warning);
  color: var(--warning-text);
  background: var(--warning-surface);
}
.expiry-expired {
  --status-color: var(--red);
  color: var(--danger-text);
  background: var(--danger-surface);
}
.documents-message {
  border-top: 1px solid var(--border);
  padding: 1.25rem 0 0;
  margin: 1rem 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}
#documents-error {
  color: var(--danger-text);
}
@media (max-width: 640px) {
  .documents-section {
    padding: 1rem;
  }
}
</style>
