import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseConfig {
  url: string
  publishableKey: string
}

export function readSupabaseConfig(): SupabaseConfig {
  return {
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
  }
}

export function createSupabaseClient(config: SupabaseConfig = readSupabaseConfig()): SupabaseClient {
  if (!config.url || !config.publishableKey) {
    throw new Error('Supabase 환경변수를 설정해 주세요.')
  }

  return createClient(config.url, config.publishableKey)
}
