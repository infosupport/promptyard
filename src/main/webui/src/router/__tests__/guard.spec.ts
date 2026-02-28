import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useProfileStore } from '@/stores/profile'
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
  privacyAcceptedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  modifiedAt: null,
}

async function importRouter() {
  const mod = await import('../index')
  return mod.default
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  setActivePinia(createPinia())
})

describe('navigation guard', () => {
  it('allows navigation to /welcome without profile check', async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(null)

    const router = await importRouter()
    router.push('/welcome')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('welcome')
    expect(getCurrentProfile).not.toHaveBeenCalled()
  })

  it('redirects to /welcome when no profile exists', async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(null)

    const router = await importRouter()
    router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('welcome')
  })

  it('allows navigation when profile exists', async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(mockProfile)

    const router = await importRouter()
    router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('home')
  })

  it('allows navigation on API error (does not redirect)', async () => {
    vi.mocked(getCurrentProfile).mockRejectedValue(new Error('Network error'))

    const router = await importRouter()
    router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('home')
  })

  it('fetches profile only once across multiple navigations', async () => {
    vi.mocked(getCurrentProfile).mockResolvedValue(mockProfile)

    const router = await importRouter()

    // First navigation triggers fetchProfile
    router.push('/')
    await router.isReady()
    expect(router.currentRoute.value.name).toBe('home')

    // The store is now loaded, so a second navigation to a different route
    // should not call getCurrentProfile again.
    // Since we only have one route, we verify via the store's loaded flag
    // and the call count after the first navigation.
    const store = useProfileStore()
    expect(store.loaded).toBe(true)
    expect(getCurrentProfile).toHaveBeenCalledOnce()

    // Calling fetchProfile again should be a no-op
    await store.fetchProfile()
    expect(getCurrentProfile).toHaveBeenCalledOnce()
  })
})
