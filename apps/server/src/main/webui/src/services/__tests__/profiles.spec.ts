import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCurrentProfile,
  createProfile,
  updateProfile,
  getProfileBySlug,
  getProfileContent,
  type UserProfile,
  type MyContentPageResponse,
} from '../profiles'

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

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('getCurrentProfile', () => {
  it('returns the user profile on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProfile),
    } as Response)

    const result = await getCurrentProfile()

    expect(fetch).toHaveBeenCalledWith('/api/profiles/me')
    expect(result).toEqual(mockProfile)
  })

  it('returns null on 404 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    const result = await getCurrentProfile()

    expect(result).toBeNull()
  })

  it('throws on server error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    await expect(getCurrentProfile()).rejects.toThrow('Failed to fetch profile: 500')
  })

  it('propagates network errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(getCurrentProfile()).rejects.toThrow('Failed to fetch')
  })
})

describe('createProfile', () => {
  it('sends POST with correct body and returns the slug', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ slug: 'john-doe' }),
    } as Response)

    const result = await createProfile({
      jobTitle: 'Developer',
      businessUnit: 'Engineering',
      privacyAccepted: true,
    })

    expect(fetch).toHaveBeenCalledWith('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle: 'Developer',
        businessUnit: 'Engineering',
        privacyAccepted: true,
      }),
    })
    expect(result).toEqual({ slug: 'john-doe' })
  })

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
    } as Response)

    await expect(
      createProfile({ privacyAccepted: true }),
    ).rejects.toThrow('Failed to create profile: 400')
  })

  it('sends null fields when optional values are omitted', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ slug: 'john-doe' }),
    } as Response)

    await createProfile({
      jobTitle: null,
      businessUnit: null,
      privacyAccepted: true,
    })

    expect(fetch).toHaveBeenCalledWith('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle: null,
        businessUnit: null,
        privacyAccepted: true,
      }),
    })
  })
})

describe('updateProfile', () => {
  it('sends PUT to /api/profiles/me with correct body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
    } as Response)

    await updateProfile({ jobTitle: 'Engineer', businessUnit: 'R&D' })

    expect(fetch).toHaveBeenCalledWith('/api/profiles/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobTitle: 'Engineer', businessUnit: 'R&D' }),
    })
  })

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    await expect(updateProfile({ jobTitle: 'Engineer', businessUnit: null })).rejects.toThrow(
      'Failed to update profile: 500',
    )
  })

  it('sends null fields when values are null', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
    } as Response)

    await updateProfile({ jobTitle: null, businessUnit: null })

    expect(fetch).toHaveBeenCalledWith('/api/profiles/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobTitle: null, businessUnit: null }),
    })
  })
})

describe('getProfileBySlug', () => {
  it('returns the profile on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProfile),
    } as Response)

    const result = await getProfileBySlug('john-doe')

    expect(fetch).toHaveBeenCalledWith('/api/profiles/john-doe')
    expect(result).toEqual(mockProfile)
  })

  it('throws on 404 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    await expect(getProfileBySlug('nonexistent')).rejects.toThrow(
      'Failed to fetch profile: 404',
    )
  })

  it('throws on server error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    await expect(getProfileBySlug('john-doe')).rejects.toThrow(
      'Failed to fetch profile: 500',
    )
  })
})

describe('getProfileContent', () => {
  const mockContentPage: MyContentPageResponse = {
    items: [
      {
        slug: 'test-prompt',
        title: 'Test Prompt',
        description: 'A test prompt',
        tags: ['testing'],
        contentType: 'prompt',
        authorName: 'John Doe',
        createdAt: '2026-02-20T10:00:00Z',
        modifiedAt: null,
      },
    ],
    pageIndex: 0,
    totalPages: 1,
  }

  it('returns the content page on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockContentPage),
    } as Response)

    const result = await getProfileContent('john-doe', 0)

    expect(fetch).toHaveBeenCalledWith('/api/profiles/john-doe/content?page=0')
    expect(result).toEqual(mockContentPage)
  })

  it('passes slug and page correctly in URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockContentPage),
    } as Response)

    await getProfileContent('jane-doe', 2)

    expect(fetch).toHaveBeenCalledWith('/api/profiles/jane-doe/content?page=2')
  })

  it('throws on error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    await expect(getProfileContent('john-doe', 0)).rejects.toThrow(
      'Failed to fetch profile content: 500',
    )
  })
})
