<script setup lang="ts">
import AppNavigation from '../components/navigation/AppNavigation.vue';
const route = useRoute();
const error = useError();
const showNavigation = computed(() => route.path !== '/login' && !error.value);
</script>

<template>
  <div class="app-shell" :class="{ 'with-navigation': showNavigation }">
    <a v-if="!error" class="skip-link" href="#main-content">Skip to content</a>
    <slot /><AppNavigation v-if="showNavigation" />
  </div>
</template>

<style scoped lang="scss">
.with-navigation {
  padding-bottom: calc(5rem + env(safe-area-inset-bottom));
}
@media (max-width: 767px) {
  .with-navigation {
    padding-bottom: calc(6rem + env(safe-area-inset-bottom));
  }
}
</style>
