import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getComments, createComment, type CommentResponse } from '../comments'

const mockComments: CommentResponse[] = [
  {
    id: 2,
    text: 'I agree, very useful!',
    createdAt: '2026-02-28T11:00:00Z',
    authorFullName: 'John Smith',
  },
  {
    id: 1,
    text: 'Great prompt!',
    createdAt: '2026-02-28T10:00:00Z',
    authorFullName: 'Jane Doe',
  },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('getComments', () => {
  it('fetches comments by slug and returns the response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockComments),
    } as Response)

    const result = await getComments('code-review-checklist')

    expect(fetch).toHaveBeenCalledWith(
      '/api/content/prompts/code-review-checklist/comments',
    )
    expect(result).toEqual(mockComments)
  })

  it('throws on 404 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    await expect(getComments('nonexistent')).rejects.toThrow('Failed to fetch comments: 404')
  })

  it('throws on server error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    await expect(getComments('test')).rejects.toThrow('Failed to fetch comments: 500')
  })

  it('encodes the slug in the URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)

    await getComments('my prompt')

    expect(fetch).toHaveBeenCalledWith('/api/content/prompts/my%20prompt/comments')
  })

  it('propagates network errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(getComments('test')).rejects.toThrow('Failed to fetch')
  })
})

describe('createComment', () => {
  it('sends POST with correct body and returns the created comment', async () => {
    const created: CommentResponse = {
      id: 3,
      text: 'Nice work!',
      createdAt: '2026-02-28T12:00:00Z',
      authorFullName: 'Alice Johnson',
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(created),
    } as Response)

    const result = await createComment('code-review-checklist', { text: 'Nice work!' })

    expect(fetch).toHaveBeenCalledWith(
      '/api/content/prompts/code-review-checklist/comments',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Nice work!' }),
      },
    )
    expect(result).toEqual(created)
  })

  it('throws on 400 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
    } as Response)

    await expect(createComment('test', { text: '' })).rejects.toThrow(
      'Failed to create comment: 400',
    )
  })

  it('throws on 404 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    await expect(createComment('nonexistent', { text: 'Hello' })).rejects.toThrow(
      'Failed to create comment: 404',
    )
  })

  it('encodes the slug in the URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(mockComments[0]),
    } as Response)

    await createComment('my prompt', { text: 'Hello' })

    expect(fetch).toHaveBeenCalledWith(
      '/api/content/prompts/my%20prompt/comments',
      expect.any(Object),
    )
  })

  it('propagates network errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(createComment('test', { text: 'Hello' })).rejects.toThrow('Failed to fetch')
  })
})
