import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProfileStore } from '../profile'
import type { UserProfile } from '@/services/profiles'

vi.mock('@/services/profiles', () => ({
  getCurrentProfile: vi.fn(),
}))

import { getCurrentProfile } from '@/services/profiles'

const mockProfile: UserProfile = {
  id: 1,
  slug: 'john-doe',
  fullName: 'John Doe',
  emailAddress: 'john@example.com',
  businessUnit: 'Engineering',
  jobTitle: 'Developer',
  createdAt: '2026-01-01T00:00:00Z',
  modifiedAt: null,
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useProfileStore', () => {
  describe('fetchProfile', () => {
    it('calls getCurrentProfile and sets profile on success', async () => {
      vi.mocked(getCurrentProfile).mockResolvedValue(mockProfile)

      const store = useProfileStore()
      await store.fetchProfile()

      expect(getCurrentProfile).toHaveBeenCalledOnce()
      expect(store.profile).toEqual(mockProfile)
      expect(store.loaded).toBe(true)
      expect(store.error).toBe(false)
    })

    it('sets profile to null when getCurrentProfile returns null (404)', async () => {
      vi.mocked(getCurrentProfile).mockResolvedValue(null)

      const store = useProfileStore()
      await store.fetchProfile()

      expect(store.profile).toBeNull()
      expect(store.loaded).toBe(true)
      expect(store.error).toBe(false)
    })

    it('sets error to true on network failure', async () => {
      vi.mocked(getCurrentProfile).mockRejectedValue(new Error('Network error'))

      const store = useProfileStore()
      await store.fetchProfile()

      expect(store.profile).toBeNull()
      expect(store.loaded).toBe(true)
      expect(store.error).toBe(true)
    })

    it('is idempotent when already loaded', async () => {
      vi.mocked(getCurrentProfile).mockResolvedValue(mockProfile)

      const store = useProfileStore()
      await store.fetchProfile()
      await store.fetchProfile()

      expect(getCurrentProfile).toHaveBeenCalledOnce()
    })
  })

  describe('refreshProfile', () => {
    it('re-fetches profile regardless of loaded state', async () => {
      vi.mocked(getCurrentProfile).mockResolvedValue(mockProfile)

      const store = useProfileStore()
      await store.fetchProfile()
      expect(getCurrentProfile).toHaveBeenCalledOnce()

      const updatedProfile = { ...mockProfile, jobTitle: 'Senior Developer' }
      vi.mocked(getCurrentProfile).mockResolvedValue(updatedProfile)

      await store.refreshProfile()

      expect(getCurrentProfile).toHaveBeenCalledTimes(2)
      expect(store.profile).toEqual(updatedProfile)
      expect(store.loaded).toBe(true)
      expect(store.error).toBe(false)
    })

    it('sets error to true on failure', async () => {
      vi.mocked(getCurrentProfile).mockRejectedValue(new Error('Network error'))

      const store = useProfileStore()
      await store.refreshProfile()

      expect(store.error).toBe(true)
      expect(store.loaded).toBe(true)
    })

    it('clears previous error on successful refresh', async () => {
      vi.mocked(getCurrentProfile).mockRejectedValue(new Error('Network error'))

      const store = useProfileStore()
      await store.refreshProfile()
      expect(store.error).toBe(true)

      vi.mocked(getCurrentProfile).mockResolvedValue(mockProfile)
      await store.refreshProfile()

      expect(store.error).toBe(false)
      expect(store.profile).toEqual(mockProfile)
    })
  })

  describe('setProfile', () => {
    it('updates the store with the given profile', () => {
      const store = useProfileStore()
      store.setProfile(mockProfile)

      expect(store.profile).toEqual(mockProfile)
      expect(store.loaded).toBe(true)
      expect(store.error).toBe(false)
    })

    it('clears a previous error state', async () => {
      vi.mocked(getCurrentProfile).mockRejectedValue(new Error('fail'))

      const store = useProfileStore()
      await store.fetchProfile()
      expect(store.error).toBe(true)

      store.setProfile(mockProfile)
      expect(store.error).toBe(false)
      expect(store.profile).toEqual(mockProfile)
    })
  })

  describe('$reset', () => {
    it('resets the store to initial state', async () => {
      vi.mocked(getCurrentProfile).mockResolvedValue(mockProfile)

      const store = useProfileStore()
      await store.fetchProfile()
      expect(store.profile).toEqual(mockProfile)

      store.$reset()

      expect(store.profile).toBeNull()
      expect(store.loaded).toBe(false)
      expect(store.error).toBe(false)
    })
  })
})
