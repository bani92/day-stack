<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { useAppDailyLogStore } from '../app/daily-log-store'
import BackupControls from '../components/BackupControls.vue'
import { toLocalDateKey } from '../domain/date-key'

const store = useAppDailyLogStore()
const status = ref<string | null>(null)

function clearStatus() {
  status.value = null
}

async function handleExport() {
  clearStatus()
  const serialized = await store.exportSnapshot()

  if (serialized === null) {
    return
  }

  const objectUrl = URL.createObjectURL(
    new Blob([serialized], { type: 'application/json' }),
  )
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = `daystack-backup-${toLocalDateKey(new Date())}.json`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
  status.value = '데이터를 내보냈습니다.'
}

async function handleImport(serialized: string) {
  clearStatus()
  await store.importSnapshot(serialized)

  if (!store.error) {
    status.value = '데이터를 가져왔습니다.'
  }
}

async function handleClearAll() {
  const confirmed = window.confirm('모든 기록을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')

  if (!confirmed) {
    return
  }

  clearStatus()
  const cleared = await store.clearAll()

  if (cleared) {
    status.value = '모든 기록을 삭제했습니다.'
  }
}

onMounted(() => {
  void store.loadAll()
})
</script>

<template>
  <main class="mx-auto w-full max-w-[720px] min-w-0">
    <section class="space-y-6">
      <div class="space-y-3">
        <p class="text-sm font-medium tracking-[0.08em] text-[var(--ds-muted)] uppercase">설정</p>
        <h1 class="text-[clamp(1.625rem,2vw+1.1rem,2rem)] font-semibold tracking-tight text-[var(--ds-ink)]">
          데이터를 안전하게 보관하세요.
        </h1>
        <p class="text-base leading-7 text-[var(--ds-muted)]">
          로그인한 계정의 기록은 Supabase에 저장되고, RLS 정책에 따라 본인 기록만 접근할 수 있습니다. 필요할 때 JSON 백업을 내려받아 보관하세요.
        </p>
      </div>

      <BackupControls @export="handleExport" @import="handleImport" />

      <section class="space-y-3 border-t border-[var(--ds-divider)] pt-6">
        <h2 class="text-base font-semibold text-[var(--ds-ink)]">데이터 초기화</h2>
        <p class="text-sm leading-6 text-[var(--ds-muted)]">
          현재 로그인한 계정의 모든 기록을 Supabase에서 삭제합니다. 삭제한 기록은 백업 파일 없이는 되돌릴 수 없습니다.
        </p>
        <button
          class="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[var(--ds-danger)] px-4 py-2 text-sm font-medium text-[var(--ds-danger)] transition-colors hover:bg-[var(--ds-danger)]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-danger)]"
          data-testid="clear-all"
          type="button"
          @click="handleClearAll"
        >
          모든 기록 삭제
        </button>
      </section>

      <p v-if="store.error" aria-live="polite" class="text-sm leading-6 text-[var(--ds-ink)]" role="alert">
        {{ store.error }}
      </p>
      <p v-else-if="status" aria-live="polite" class="text-sm leading-6 text-[var(--ds-muted)]">
        {{ status }}
      </p>
    </section>
  </main>
</template>
