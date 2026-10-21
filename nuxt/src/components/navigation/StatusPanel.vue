<template>
  <section class="status-panel">
    <div class="status-copy"><slot /></div>
    <div class="status-visual"><slot name="illustration" /></div>
  </section>
</template>

<style scoped lang="scss">
.status-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
}
.status-copy {
  align-self: center;
  min-width: 0;
  padding: clamp(1.5rem, 4vw, 3rem);
}
.status-visual {
  display: grid;
  place-items: center;
  min-height: 320px;
  background: var(--navy);
}
:slotted(h1) {
  margin-bottom: 1rem;
  font-size: clamp(1.5rem, 3vw, 2rem);
  letter-spacing: -0.04em;
}
:slotted(.status-description) {
  max-width: 42ch;
  margin-bottom: 1.75rem;
  color: var(--muted-on-background);
  font-size: 0.95rem;
}
:slotted(.status-return) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  &:hover {
    background: var(--red-hover);
  }
}
@media (max-width: 640px) {
  .status-panel {
    grid-template-columns: minmax(0, 1fr);
  }
  .status-visual {
    min-height: 220px;
  }
  :slotted(.status-return) {
    width: 100%;
  }
}
</style>
