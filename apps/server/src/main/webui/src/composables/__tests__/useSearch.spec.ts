import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { ContentPageResponse } from '@/services/content'

vi.mock('@/services/search', () => ({
  searchContent: vi.fn(),
}))

import { searchContent } from '@/services/search'
import { useSearch } from '../useSearch'

const mockSearchResult: ContentPageResponse = {
  items: [
    {
      slug: 'kotlin-prompt',
      title: 'Kotlin Best Practices',
      description: 'A prompt about Kotlin',
      tags: ['kotlin', 'best-practices'],
      contentType: 'prompt',
      author: { fullName: 'Willem Meints' },
      createdAt: '2026-02-20T10:00:00Z',
      modifiedAt: null,
    },
    {
      slug: 'kotlin-skill',
      title: 'Kotlin Refactoring',
      description: 'A skill for refactoring Kotlin',
      tags: ['kotlin'],
      contentType: 'skill',
      author: { fullName: 'Jane Doe' },
      createdAt: '2026-02-18T10:00:00Z',
      modifiedAt: null,
    },
  ],
  pageIndex: 0,
  totalPages: 2,
}

type UseSearchReturn = ReturnType<typeof useSearch>

function mountComposable() {
  let result!: UseSearchReturn

  const wrapper = mount(
    defineComponent({
      setup() {
        result = useSearch()
        return {}
      },
      template: '<div />',
    }),
  )

  return { result, wrapper }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useSearch', () => {
  it('does not auto-fetch on mount', async () => {
    const { result } = mountComposable()
    await flushPromises()

    expect(searchContent).not.toHaveBeenCalled()
    expect(result.loading.value).toBe(false)
    expect(result.items.value).toEqual([])
  })

  it('fetches search results when search is called', async () => {
    vi.mocked(searchContent).mockResolvedValue(mockSearchResult)

    const { result } = mountComposable()
    result.search('kotlin', 0)
    await flushPromises()

    expect(searchContent).toHaveBeenCalledWith('kotlin', 0, expect.any(AbortSignal))
    expect(result.items.value).toHaveLength(2)
  })

  it('maps response items to ContentItemSummary with correct URLs', async () => {
    vi.mocked(searchContent).mockResolvedValue(mockSearchResult)

    const { result } = mountComposable()
    result.search('kotlin', 0)
    await flushPromises()

    expect(result.items.value[0]).toEqual({
      title: 'Kotlin Best Practices',
      description: 'A prompt about Kotlin',
      tags: ['kotlin', 'best-practices'],
      contentType: 'prompt',
      authorName: 'Willem Meints',
      url: '/content/prompts/kotlin-prompt',
    })
    expect(result.items.value[1]).toEqual({
      title: 'Kotlin Refactoring',
      description: 'A skill for refactoring Kotlin',
      tags: ['kotlin'],
      contentType: 'skill',
      authorName: 'Jane Doe',
      url: '/content/skills/kotlin-skill',
    })
  })

  it('exposes pageIndex and totalPages from response', async () => {
    vi.mocked(searchContent).mockResolvedValue({
      ...mockSearchResult,
      pageIndex: 1,
      totalPages: 3,
    })

    const { result } = mountComposable()
    result.search('kotlin', 1)
    await flushPromises()

    expect(result.pageIndex.value).toBe(1)
    expect(result.totalPages.value).toBe(3)
  })

  it('sets loading true during fetch and false after', async () => {
    let resolvePromise!: (value: ContentPageResponse) => void
    vi.mocked(searchContent).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve
      }),
    )

    const { result } = mountComposable()
    expect(result.loading.value).toBe(false)

    result.search('kotlin', 0)
    expect(result.loading.value).toBe(true)

    resolvePromise(mockSearchResult)
    await flushPromises()

    expect(result.loading.value).toBe(false)
  })

  it('sets error to true when search fails', async () => {
    vi.mocked(searchContent).mockRejectedValue(new Error('Network error'))

    const { result } = mountComposable()
    result.search('kotlin', 0)
    await flushPromises()

    expect(result.error.value).toBe(true)
    expect(result.loading.value).toBe(false)
    expect(result.items.value).toEqual([])
  })

  it('clears error on successful subsequent search', async () => {
    vi.mocked(searchContent).mockRejectedValueOnce(new Error('fail'))

    const { result } = mountComposable()
    result.search('kotlin', 0)
    await flushPromises()

    expect(result.error.value).toBe(true)

    vi.mocked(searchContent).mockResolvedValueOnce(mockSearchResult)
    result.search('kotlin', 0)
    await flushPromises()

    expect(result.error.value).toBe(false)
    expect(result.items.value).toHaveLength(2)
  })

  it('defaults pageIndex to 0 and totalPages to 0 before any search', () => {
    const { result } = mountComposable()

    expect(result.pageIndex.value).toBe(0)
    expect(result.totalPages.value).toBe(0)
  })

  it('aborts previous request when a new search is initiated', async () => {
    let call = 0
    vi.mocked(searchContent).mockImplementation((_query, _page, signal) => {
      call++
      return new Promise((resolve, reject) => {
        if (signal) {
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }
        if (call === 2) {
          resolve(mockSearchResult)
        }
      })
    })

    const { result } = mountComposable()

    result.search('kotlin', 0)
    result.search('quarkus', 0)
    await flushPromises()

    expect(searchContent).toHaveBeenCalledTimes(2)
    expect(result.error.value).toBe(false)
  })
})
