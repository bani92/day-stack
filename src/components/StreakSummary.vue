<script setup lang="ts">
const props = defineProps<{
  currentStreak: number
  longestStreak: number
  monthlyLoggedDays: number
  monthlyLoggedDaysLabel: string
}>()
</script>

<template>
  <dl class="divide-y divide-[var(--ds-divider)] border-y border-[var(--ds-divider)]">
    <div class="flex items-baseline justify-between gap-4 py-4">
      <dt class="text-sm text-[var(--ds-muted)]">현재 연속 기록</dt>
      <dd class="text-lg font-semibold text-[var(--ds-ink)]">{{ props.currentStreak }}일</dd>
    </div>
    <div class="flex items-baseline justify-between gap-4 py-4">
      <dt class="text-sm text-[var(--ds-muted)]">최장 연속 기록</dt>
      <dd class="text-lg font-semibold text-[var(--ds-ink)]">{{ props.longestStreak }}일</dd>
    </div>
    <div class="flex items-baseline justify-between gap-4 py-4">
      <dt class="text-sm text-[var(--ds-muted)]">{{ props.monthlyLoggedDaysLabel }}</dt>
      <dd class="text-lg font-semibold text-[var(--ds-ink)]">{{ props.monthlyLoggedDays }}일</dd>
    </div>
  </dl>
</template>
