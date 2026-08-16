<template>
  <div class="min-h-dvh overflow-x-hidden bg-[var(--ds-canvas)] text-[var(--ds-ink)]">
    <header class="border-b border-[var(--ds-divider)] bg-[var(--ds-surface)]/95 backdrop-blur-sm">
      <div
        class="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
      >
        <RouterLink
          class="inline-flex min-h-11 shrink-0 items-center rounded-[8px] px-2 py-2 text-sm font-semibold tracking-[0.18em] text-[var(--ds-ink)] uppercase"
          to="/today"
        >
          DayStack
        </RouterLink>

        <p class="hidden text-sm text-[var(--ds-muted)] sm:block">
          짧게 남겨도, 나중에는 흐름이 됩니다.
        </p>
      </div>
    </header>

    <div class="mx-auto flex max-w-[1200px] min-w-0">
      <DesktopNav />

      <div class="min-w-0 flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-10 lg:py-10 lg:pb-10">
        <slot />
      </div>
    </div>

    <MobileNav />
  </div>
</template>

<script setup lang="ts">
import DesktopNav from './DesktopNav.vue'
import MobileNav from './MobileNav.vue'
</script>
