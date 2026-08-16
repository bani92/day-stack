<script setup lang="ts">
const items = [
  { label: '기록', to: '/today' },
  { label: '찾기', to: '/archive' },
  { label: '돌아보기', to: '/review' },
] as const
</script>

<template>
  <nav
    aria-label="모바일 주요"
    class="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--ds-divider)] bg-[color:color-mix(in_srgb,var(--ds-surface)_92%,white)]/95 px-3 py-2 backdrop-blur-sm lg:hidden"
  >
    <div class="mx-auto grid max-w-[720px] grid-cols-3 gap-2">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex min-h-11 items-center justify-center rounded-[8px] px-3 py-3 text-sm font-medium text-[var(--ds-muted)] transition-colors hover:bg-[var(--ds-accent-soft)] hover:text-[var(--ds-ink)]"
      >
        {{ item.label }}
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.router-link-active {
  background: var(--ds-accent-soft);
  color: var(--ds-ink);
}
</style>
