import { describe, it, expect, vi } from 'vitest'
import { getSeasonalIcon } from '../lib/seasonalIcons'

describe('getSeasonalIcon', () => {
  it('should return pumpkin emoji for October', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-10-15'))
    expect(getSeasonalIcon()).toBe('🎃')
    vi.useRealTimers()
  })

  it('should return turkey emoji for November', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-11-15'))
    expect(getSeasonalIcon()).toBe('🦃')
    vi.useRealTimers()
  })

  it('should return Christmas tree emoji for December', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-12-15'))
    expect(getSeasonalIcon()).toBe('🎄')
    vi.useRealTimers()
  })

  it('should return crossed swords emoji for other months', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15'))
    expect(getSeasonalIcon()).toBe('⚔️')
    vi.useRealTimers()
  })
})
