import { describe, it, expect } from 'vitest'
import { getInitials, formatMemberSince } from '../format'

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
