import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createPrompt,
  getPromptBySlug,
  type SubmitPromptRequest,
  type PromptDetailResponse,
} from '../prompts'

const mockRequest: SubmitPromptRequest = {
  title: 'Code Review Checklist',
  description: 'A checklist for reviewing code',
  content: '# Code Review\n\n- Check for errors\n- Check for style',
  tags: ['kotlin', 'review'],
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('createPrompt', () => {
  it('sends POST with correct body and returns the slug', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ slug: 'code-review-checklist' }),
    } as Response)

    const result = await createPrompt(mockRequest)

    expect(fetch).toHaveBeenCalledWith('/api/content/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockRequest),
    })
    expect(result).toEqual({ slug: 'code-review-checklist' })
  })

  it('throws on 404 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    await expect(createPrompt(mockRequest)).rejects.toThrow('Failed to create prompt: 404')
  })

  it('throws on server error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    await expect(createPrompt(mockRequest)).rejects.toThrow('Failed to create prompt: 500')
  })

  it('propagates network errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(createPrompt(mockRequest)).rejects.toThrow('Failed to fetch')
  })
})

const mockPromptDetail: PromptDetailResponse = {
  title: 'Code Review Checklist',
  slug: 'code-review-checklist',
  description: 'A checklist for reviewing code',
  content: '# Code Review\n\n- Check for errors',
  tags: ['kotlin', 'review'],
  contentType: 'prompt',
  createdAt: '2026-01-15T10:00:00Z',
  modifiedAt: null,
  author: {
    fullName: 'Jane Doe',
    jobTitle: 'Senior Engineer',
    profileSlug: 'jane-doe',
    promptCount: 5,
    skillCount: 2,
    agentCount: 0,
    workflowCount: 1,
  },
  isOwner: false,
}

describe('getPromptBySlug', () => {
  it('fetches prompt by slug and returns the response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPromptDetail),
    } as Response)

    const result = await getPromptBySlug('code-review-checklist')

    expect(fetch).toHaveBeenCalledWith('/api/content/prompts/code-review-checklist')
    expect(result).toEqual(mockPromptDetail)
  })

  it('throws on 404 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    await expect(getPromptBySlug('nonexistent')).rejects.toThrow('Failed to fetch prompt: 404')
  })

  it('throws on server error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    await expect(getPromptBySlug('test')).rejects.toThrow('Failed to fetch prompt: 500')
  })

  it('encodes the slug in the URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPromptDetail),
    } as Response)

    await getPromptBySlug('my prompt')

    expect(fetch).toHaveBeenCalledWith('/api/content/prompts/my%20prompt')
  })

  it('propagates network errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(getPromptBySlug('test')).rejects.toThrow('Failed to fetch')
  })
})
