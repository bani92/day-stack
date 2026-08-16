<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <main class="min-h-dvh px-6 py-8 sm:px-10 lg:px-14">
    <section class="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-4xl flex-col justify-center gap-5">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--daystack-muted)]">
        {{ eyebrow }}
      </p>

      <div class="space-y-3">
        <h1 class="text-4xl font-semibold tracking-tight text-[var(--daystack-ink)] sm:text-5xl">
          {{ title }}
        </h1>
        <p class="max-w-2xl text-base leading-7 text-[var(--daystack-muted)] sm:text-lg">
          {{ description }}
        </p>
      </div>
    </section>
  </main>
</template>
