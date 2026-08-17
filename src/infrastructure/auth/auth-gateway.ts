import type { SupabaseClient } from '@supabase/supabase-js'

import { createSupabaseClient } from '../supabase/client'

export interface AuthUser {
  id: string
  email: string | null
}

export interface AuthGateway {
  getCurrentUser(): Promise<AuthUser | null>
  signIn(email: string, password: string): Promise<void>
}

export interface SupabaseAuthClient {
  auth: Pick<SupabaseClient['auth'], 'getSession' | 'signInWithPassword'>
}

export function createSupabaseAuthGateway(client: SupabaseAuthClient): AuthGateway {
  return {
    async getCurrentUser() {
      const { data, error } = await client.auth.getSession()

      if (error) {
        throw new Error(error.message)
      }

      const user = data.session?.user

      if (!user) {
        return null
      }

      return {
        id: user.id,
        email: user.email ?? null,
      }
    },

    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password })

      if (error) {
        throw new Error(error.message)
      }
    },
  }
}

export function createUnavailableAuthGateway(message = 'Supabase 환경변수를 설정해 주세요.'): AuthGateway {
  return {
    async getCurrentUser() {
      return null
    },
    async signIn() {
      throw new Error(message)
    },
  }
}

export function createConfiguredAuthGateway(): AuthGateway {
  try {
    return createSupabaseAuthGateway(createSupabaseClient())
  } catch (error) {
    return createUnavailableAuthGateway(error instanceof Error ? error.message : undefined)
  }
}
