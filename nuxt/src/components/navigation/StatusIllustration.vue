<script setup lang="ts">
import { useId } from 'vue';
defineProps<{ code?: number }>();
const gridId = useId();
</script>

<template>
  <svg viewBox="0 0 420 360" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <pattern
        :id="gridId"
        width="30"
        height="30"
        patternUnits="userSpaceOnUse"
      >
        <path d="M30 0H0V30" stroke="#d3dce8" stroke-opacity=".12" />
      </pattern>
    </defs>
    <path :fill="`url(#${gridId})`" d="M0 0h420v360H0z" />
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
      v-if="code !== undefined"
      x="210"
      y="161"
      text-anchor="middle"
      fill="#fff"
      font-size="96"
      font-weight="800"
      letter-spacing="-4"
    >
      {{ code }}
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
    <g
      :transform="code === undefined
        ? 'translate(210 180) rotate(58) scale(1.5)'
        : 'translate(243 230) rotate(58)'"
    >
      <circle r="43" fill="#0e2138" />
      <path
        d="M-4-31h8l4 21L30 5v7L7 3 5 23l10 8v5L0 31l-15 5v-5l10-8-2-20-23 9V5l22-15z"
        fill="#fff"
      />
      <path d="M-4-31h8l2 10H-6z" fill="#e63757" />
    </g>
  </svg>
</template>

<style scoped lang="scss">
svg {
  display: block;
  width: 100%;
  max-height: 360px;
}
@media (max-width: 640px) {
  svg {
    max-height: 220px;
  }
}
</style>
