import { describe, expect, it } from 'vitest'

describe('daily-log', () => {
  it('treats logs with all blank fields as not meaningful', async () => {
    const { isMeaningfulLog } = await import('./daily-log')

    expect(
      isMeaningfulLog({
        done: ' ',
        learned: '',
        blocked: '   ',
        next: '',
      }),
    ).toBe(false)
  })

  it('treats a log with at least one non-blank field as meaningful', async () => {
    const { isMeaningfulLog } = await import('./daily-log')

    expect(
      isMeaningfulLog({
        done: '',
        learned: 'Vue composable boundary learned',
        blocked: '',
        next: '',
      }),
    ).toBe(true)
  })
})
