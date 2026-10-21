<template>
  <header class="workspace-masthead">
    <div class="workspace-brand">
      <BrandMark />
      <span>Pilot workspace</span>
    </div>
    <div v-if="$slots.actions" class="workspace-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.workspace-masthead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 72px;
  padding: 0.75rem 1.5rem;
  border-radius: 16px;
  background: var(--navy);
  color: var(--surface);
}
.workspace-brand {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  span {
    border-left: 1px solid #ffffff30;
    padding-left: 1.5rem;
    color: #d3dce8;
    font-size: 0.8rem;
  }
}
.workspace-actions {
  flex: 0 0 auto;
  :deep(.secondary-button) {
    background: transparent;
    border-color: #ffffff55;
    color: var(--surface);
    &:hover:enabled {
      background: #ffffff15;
    }
    &:focus-visible {
      outline-color: var(--surface);
    }
  }
}
@media (max-width: 640px) {
  .workspace-masthead {
    min-height: 64px;
    padding: 0.6rem 1rem;
  }
  .workspace-brand span {
    display: none;
  }
}
</style>
