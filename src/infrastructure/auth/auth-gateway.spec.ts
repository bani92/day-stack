import { describe, expect, it, vi } from 'vitest'

import { createSupabaseAuthGateway, type SupabaseAuthClient } from './auth-gateway'

function createClientFixture() {
  return {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  } as unknown as SupabaseAuthClient & {
    auth: {
      getSession: ReturnType<typeof vi.fn>
      signInWithPassword: ReturnType<typeof vi.fn>
    }
  }
}

describe('createSupabaseAuthGateway', () => {
  it('returns the current authenticated user from the Supabase session', async () => {
    const client = createClientFixture()
    client.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-1', email: 'owner@example.com' },
        },
      },
      error: null,
    })
    const gateway = createSupabaseAuthGateway(client)

    await expect(gateway.getCurrentUser()).resolves.toEqual({
      id: 'user-1',
      email: 'owner@example.com',
    })
  })

  it('returns null when the Supabase session is missing', async () => {
    const client = createClientFixture()
    client.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    const gateway = createSupabaseAuthGateway(client)

    await expect(gateway.getCurrentUser()).resolves.toBeNull()
  })

  it('signs in with the provided email and password', async () => {
    const client = createClientFixture()
    client.auth.signInWithPassword.mockResolvedValue({ error: null })
    const gateway = createSupabaseAuthGateway(client)

    await gateway.signIn('owner@example.com', 'password')

    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'password',
    })
  })

  it('exposes Supabase sign-in errors to the login view', async () => {
    const client = createClientFixture()
    client.auth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })
    const gateway = createSupabaseAuthGateway(client)

    await expect(gateway.signIn('owner@example.com', 'wrong')).rejects.toThrow(
      'Invalid login credentials',
    )
  })
})
