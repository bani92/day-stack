<script setup lang="ts">
const items = [
  { label: '기록', to: '/today' },
  { label: '찾기', to: '/archive' },
  { label: '돌아보기', to: '/review' },
] as const
</script>

<template>
  <nav
    aria-label="주요"
    class="sticky top-0 hidden h-dvh w-[216px] shrink-0 border-r border-[var(--ds-divider)] px-5 py-8 lg:block"
  >
    <div class="flex h-full flex-col justify-between">
      <div class="space-y-2">
        <p class="px-3 text-xs font-semibold tracking-[0.18em] text-[var(--ds-muted)] uppercase">
          둘러보기
        </p>

        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="block min-h-11 rounded-[8px] px-3 py-3 text-base text-[var(--ds-muted)] transition-colors hover:bg-[var(--ds-accent-soft)] hover:text-[var(--ds-ink)]"
        >
          {{ item.label }}
        </RouterLink>
      </div>

      <p class="px-3 text-sm leading-6 text-[var(--ds-muted)]">
        오늘을 짧게 남기고, 흐름으로 다시 읽어보세요.
      </p>
    </div>
  </nav>
</template>

<style scoped>
.router-link-active {
  background: var(--ds-accent-soft);
  color: var(--ds-ink);
  font-weight: 600;
}
</style>
