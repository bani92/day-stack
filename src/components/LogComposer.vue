<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'

import { isMeaningfulLog, type DailyLogInput } from '../domain/daily-log'
import PromptField from './PromptField.vue'

const props = withDefaults(
  defineProps<{
    initialValue?: DailyLogInput | null
    isSaving?: boolean
  }>(),
  {
    initialValue: null,
    isSaving: false,
  },
)

const emit = defineEmits<{
  save: [input: DailyLogInput]
}>()

const ERROR_ID = 'daily-log-error'

function createDraft(value: DailyLogInput | null | undefined): DailyLogInput {
  return {
    done: value?.done ?? '',
    learned: value?.learned ?? '',
    blocked: value?.blocked ?? '',
    next: value?.next ?? '',
  }
}

const draft = reactive<DailyLogInput>(createDraft(props.initialValue))
const inlineMessage = ref('')
const firstPromptField = ref<InstanceType<typeof PromptField> | null>(null)

watch(
  () => [
    props.initialValue?.done ?? '',
    props.initialValue?.learned ?? '',
    props.initialValue?.blocked ?? '',
    props.initialValue?.next ?? '',
  ],
  ([done, learned, blocked, next]) => {
    Object.assign(draft, {
      done,
      learned,
      blocked,
      next,
    })
    inlineMessage.value = ''
  },
  { immediate: true },
)

watch(
  () => [draft.done, draft.learned, draft.blocked, draft.next],
  () => {
    if (isMeaningfulLog(draft)) {
      inlineMessage.value = ''
    }
  },
)

async function focusFirstField() {
  await nextTick()
  firstPromptField.value?.focus()
}

async function handleSubmit() {
  const payload = { ...draft }

  if (!isMeaningfulLog(payload)) {
    inlineMessage.value = '한 가지라도 적으면 저장할 수 있습니다.'
    await focusFirstField()
    return
  }

  inlineMessage.value = ''
  emit('save', payload)
}
</script>

<template>
  <form class="space-y-8" @submit.prevent="handleSubmit">
    <ol class="space-y-8">
      <li class="space-y-3">
        <p class="text-sm font-medium text-[var(--ds-muted)]">1.</p>
        <PromptField
          id="daily-log-done"
          ref="firstPromptField"
          v-model="draft.done"
          :described-by="inlineMessage ? ERROR_ID : undefined"
          :invalid="Boolean(inlineMessage)"
          label="오늘 한 일"
        />
      </li>

      <li class="space-y-3">
        <p class="text-sm font-medium text-[var(--ds-muted)]">2.</p>
        <PromptField
          id="daily-log-learned"
          v-model="draft.learned"
          :described-by="inlineMessage ? ERROR_ID : undefined"
          :invalid="Boolean(inlineMessage)"
          label="배운 점"
        />
      </li>

      <li class="space-y-3">
        <p class="text-sm font-medium text-[var(--ds-muted)]">3.</p>
        <PromptField
          id="daily-log-blocked"
          v-model="draft.blocked"
          :described-by="inlineMessage ? ERROR_ID : undefined"
          :invalid="Boolean(inlineMessage)"
          label="막힌 점"
        />
      </li>

      <li class="space-y-3">
        <p class="text-sm font-medium text-[var(--ds-muted)]">4.</p>
        <PromptField
          id="daily-log-next"
          v-model="draft.next"
          :described-by="inlineMessage ? ERROR_ID : undefined"
          :invalid="Boolean(inlineMessage)"
          label="다음에 이어갈 일"
        />
      </li>
    </ol>

    <div class="space-y-3">
      <button
        class="min-h-11 rounded-[8px] bg-[var(--ds-accent)] px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
        :disabled="isSaving"
        type="submit"
      >
        기록 저장
      </button>

      <p
        v-if="inlineMessage"
        :id="ERROR_ID"
        class="text-sm leading-6 text-[var(--ds-danger)]"
        role="alert"
      >
        {{ inlineMessage }}
      </p>
    </div>
  </form>
</template>
