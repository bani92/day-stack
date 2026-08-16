<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
  id: string
  label: string
  modelValue: string
  describedBy?: string
  invalid?: boolean
}>(),
  {
    describedBy: undefined,
    invalid: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaElement = ref<HTMLTextAreaElement | null>(null)

function focus() {
  textareaElement.value?.focus()
}

defineExpose({
  focus,
})
</script>

<template>
  <div class="space-y-3">
    <label :for="props.id" class="block text-base font-semibold text-[var(--ds-ink)]">
      {{ props.label }}
    </label>
    <textarea
      :id="props.id"
      ref="textareaElement"
      :aria-describedby="props.describedBy"
      :aria-invalid="props.invalid ? 'true' : 'false'"
      :value="props.modelValue"
      class="block min-h-[132px] w-full rounded-[8px] border border-[var(--ds-divider)] bg-[var(--ds-surface)] px-4 py-3 text-base leading-7 text-[var(--ds-ink)] shadow-none outline-none transition-colors placeholder:text-[var(--ds-muted)]"
      rows="5"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>
