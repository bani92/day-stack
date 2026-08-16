<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  export: []
  import: [serialized: string]
}>()

const fileError = ref<string | null>(null)

function handleFileChange(event: Event) {
  fileError.value = null

  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  const reader = new FileReader()

  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      fileError.value = '파일을 읽지 못했습니다.'
      return
    }

    emit('import', reader.result)
  }

  reader.onerror = () => {
    fileError.value = '파일을 읽지 못했습니다.'
  }

  reader.readAsText(file)
  input.value = ''
}
</script>

<template>
  <section class="space-y-4 border-y border-[var(--ds-divider)] py-6">
    <div class="flex flex-wrap gap-3">
      <button
        class="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[var(--ds-divider)] px-4 py-2 text-sm font-medium text-[var(--ds-ink)] transition-colors hover:bg-[var(--ds-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent)]"
        type="button"
        @click="emit('export')"
      >
        JSON 내보내기
      </button>

      <label
        class="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[8px] border border-[var(--ds-divider)] px-4 py-2 text-sm font-medium text-[var(--ds-ink)] transition-colors hover:bg-[var(--ds-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-accent)]"
        for="backup-file"
      >
        JSON 가져오기
      </label>
      <input
        id="backup-file"
        accept="application/json,.json"
        class="sr-only"
        type="file"
        @change="handleFileChange"
      />
    </div>

    <p v-if="fileError" aria-live="polite" class="text-sm leading-6 text-[var(--ds-ink)]" role="alert">
      {{ fileError }}
    </p>
  </section>
</template>
