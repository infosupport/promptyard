import { describe, it, expect } from 'vitest'
import { getInitials, formatMemberSince, formatRelativeTime } from '../format'

describe('getInitials', () => {
  it('returns initials from a two-word name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('returns a single initial for a single-word name', () => {
    expect(getInitials('John')).toBe('J')
  })

  it('returns first and last initials for a multi-word name', () => {
    expect(getInitials('John Michael Doe')).toBe('JD')
  })

  it('returns first and last initials skipping middle parts', () => {
    expect(getInitials('Jan van der Berg')).toBe('JB')
  })

  it('returns first and last initials for a four-word name', () => {
    expect(getInitials('Ana María García López')).toBe('AL')
  })

  it('returns empty string for empty input', () => {
    expect(getInitials('')).toBe('')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(getInitials('   ')).toBe('')
  })

  it('handles extra whitespace', () => {
    expect(getInitials('  John   Doe  ')).toBe('JD')
  })

  it('uppercases lowercase initials', () => {
    expect(getInitials('john doe')).toBe('JD')
  })
})

describe('formatMemberSince', () => {
  it('formats a January date correctly (SC-009)', () => {
    expect(formatMemberSince('2024-01-15T10:30:00Z')).toBe('Member since Jan 2024')
  })

  it('formats a December date correctly (SC-009)', () => {
    expect(formatMemberSince('2025-12-01T00:00:00Z')).toBe('Member since Dec 2025')
  })

  it('formats a future date without special handling (EC-5)', () => {
    expect(formatMemberSince('2026-06-15T00:00:00Z')).toBe('Member since Jun 2026')
  })
})

describe('formatRelativeTime', () => {
  const now = new Date('2026-02-28T12:00:00Z')

  it('returns "just now" for timestamps less than a minute ago', () => {
    expect(formatRelativeTime('2026-02-28T11:59:30Z', now)).toBe('just now')
  })

  it('returns minutes ago for timestamps less than an hour ago', () => {
    expect(formatRelativeTime('2026-02-28T11:55:00Z', now)).toBe('5 minutes ago')
  })

  it('returns singular "minute" for 1 minute ago', () => {
    expect(formatRelativeTime('2026-02-28T11:59:00Z', now)).toBe('1 minute ago')
  })

  it('returns hours ago for timestamps less than a day ago', () => {
    expect(formatRelativeTime('2026-02-28T10:00:00Z', now)).toBe('2 hours ago')
  })

  it('returns singular "hour" for 1 hour ago', () => {
    expect(formatRelativeTime('2026-02-28T11:00:00Z', now)).toBe('1 hour ago')
  })

  it('returns days ago for timestamps less than a month ago', () => {
    expect(formatRelativeTime('2026-02-25T12:00:00Z', now)).toBe('3 days ago')
  })

  it('returns singular "day" for 1 day ago', () => {
    expect(formatRelativeTime('2026-02-27T12:00:00Z', now)).toBe('1 day ago')
  })

  it('returns months ago for timestamps less than a year ago', () => {
    expect(formatRelativeTime('2025-12-28T12:00:00Z', now)).toBe('2 months ago')
  })

  it('returns years ago for timestamps more than a year ago', () => {
    expect(formatRelativeTime('2024-02-28T12:00:00Z', now)).toBe('2 years ago')
  })
})
