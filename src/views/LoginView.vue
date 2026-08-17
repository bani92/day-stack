<script setup lang="ts">
import { inject, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { appServicesKey } from '../app/services'

const injectedServices = inject(appServicesKey)

if (!injectedServices) {
  throw new Error('DayStack app services are not provided.')
}

const services = injectedServices

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const isSubmitting = ref(false)

function getRedirectPath() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''

  if (redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }

  return '/today'
}

async function handleSubmit() {
  error.value = null
  isSubmitting.value = true

  try {
    await services.authGateway.signIn(email.value.trim(), password.value)
    await router.replace(getRedirectPath())
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '로그인에 실패했습니다.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center bg-[var(--ds-canvas)] px-4 py-8">
    <section class="w-full max-w-[420px] rounded-[12px] border border-[var(--ds-divider)] bg-[var(--ds-surface)] p-6 shadow-sm sm:p-8">
      <div class="space-y-3">
        <p class="text-sm font-semibold tracking-[0.18em] text-[var(--ds-accent)] uppercase">DayStack</p>
        <h1 class="text-2xl font-semibold tracking-tight text-[var(--ds-ink)]">기록을 이어가세요.</h1>
        <p class="text-sm leading-6 text-[var(--ds-muted)]">초대받은 계정으로 로그인할 수 있습니다.</p>
      </div>

      <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
        <div class="space-y-2">
          <label class="text-sm font-medium text-[var(--ds-ink)]" for="login-email">이메일</label>
          <input
            id="login-email"
            v-model="email"
            autocomplete="email"
            class="min-h-11 w-full rounded-[8px] border border-[var(--ds-divider)] bg-[var(--ds-surface)] px-3 py-2 text-base text-[var(--ds-ink)] focus-visible:border-[var(--ds-accent)]"
            required
            type="email"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-[var(--ds-ink)]" for="login-password">비밀번호</label>
          <input
            id="login-password"
            v-model="password"
            autocomplete="current-password"
            class="min-h-11 w-full rounded-[8px] border border-[var(--ds-divider)] bg-[var(--ds-surface)] px-3 py-2 text-base text-[var(--ds-ink)] focus-visible:border-[var(--ds-accent)]"
            required
            type="password"
          />
        </div>

        <button
          class="inline-flex min-h-11 w-full items-center justify-center rounded-[8px] bg-[var(--ds-accent)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSubmitting"
          type="submit"
        >
          {{ isSubmitting ? '확인 중...' : '로그인' }}
        </button>
      </form>

      <p v-if="error" aria-live="polite" class="mt-4 text-sm leading-6 text-[var(--ds-danger)]" role="alert">
        {{ error }}
      </p>
    </section>
  </main>
</template>
