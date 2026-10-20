<script setup lang="ts">
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
        @click="refresh()"
      >
        {{
          status === 'pending' ? 'Refreshing documents' : 'Refresh documents'
        }}
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
  margin-top: 2rem;
}
.documents-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  h2 {
    margin: 0;
    font-size: 1.2rem;
    letter-spacing: -0.025em;
  }
}
.documents-refresh {
  font-size: 0.8rem;
  padding: 0.45rem 0.8rem;
}
.documents-as-of {
  font-size: 0.8rem;
  margin: 0.5rem 0 1rem;
}
.documents-list {
  list-style: none;
  padding: 0;
  margin: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.8rem 1.5rem;
    padding: 1.2rem 1.5rem;
    + li {
      border-top: 1px solid var(--border);
    }
  }
}
.document-details {
  min-width: 0;
  h3 {
    margin: 0 0 0.4rem;
    font-size: 0.9rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  p {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    margin: 0;
    font-size: 0.8rem;
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
  gap: 0.4rem;
  justify-self: start;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
.status-dot {
  width: 6px;
  height: 6px;
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
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.5rem;
  margin: 1rem 0 0;
  color: var(--muted);
}
#documents-error {
  color: var(--danger-text);
}
@media (max-width: 480px) {
  .documents-list li {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 0.6rem;
  }
  .document-details p {
    flex-direction: column;
  }
}
</style>
