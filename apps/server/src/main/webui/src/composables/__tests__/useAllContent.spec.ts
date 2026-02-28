import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { ContentPageResponse } from '@/services/content'

vi.mock('@/services/content', () => ({
  getAllContent: vi.fn(),
}))

import { getAllContent } from '@/services/content'
import { useAllContent } from '../useAllContent'

const mockContentPage: ContentPageResponse = {
  items: [
    {
      slug: 'my-prompt',
      title: 'My First Prompt',
      description: 'A test prompt',
      tags: ['testing'],
      contentType: 'prompt',
      author: { fullName: 'Willem Meints' },
      createdAt: '2026-02-20T10:00:00Z',
      modifiedAt: null,
    },
    {
      slug: 'another-prompt',
      title: 'Another Prompt',
      description: 'Second prompt',
      tags: ['ai', 'coding'],
      contentType: 'prompt',
      author: { fullName: 'Willem Meints' },
      createdAt: '2026-02-18T10:00:00Z',
      modifiedAt: null,
    },
  ],
  pageIndex: 0,
  totalPages: 1,
}

type UseAllContentReturn = ReturnType<typeof useAllContent>

function mountComposable() {
  let result!: UseAllContentReturn

  const wrapper = mount(
    defineComponent({
      setup() {
        result = useAllContent()
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

describe('useAllContent', () => {
  it('does not auto-fetch on mount', async () => {
    const { result } = mountComposable()
    await flushPromises()

    expect(getAllContent).not.toHaveBeenCalled()
    expect(result.loading.value).toBe(false)
    expect(result.items.value).toEqual([])
  })

  it('fetches content when fetchPage is called', async () => {
    vi.mocked(getAllContent).mockResolvedValue(mockContentPage)

    const { result } = mountComposable()
    result.fetchPage(0)
    await flushPromises()

    expect(getAllContent).toHaveBeenCalledWith(0)
    expect(result.items.value).toHaveLength(2)
  })

  it('maps response items to ContentItemSummary with correct URLs', async () => {
    vi.mocked(getAllContent).mockResolvedValue(mockContentPage)

    const { result } = mountComposable()
    result.fetchPage(0)
    await flushPromises()

    expect(result.items.value[0]).toEqual({
      title: 'My First Prompt',
      description: 'A test prompt',
      tags: ['testing'],
      contentType: 'prompt',
      authorName: 'Willem Meints',
      url: '/content/prompts/my-prompt',
    })
    expect(result.items.value[1]).toEqual({
      title: 'Another Prompt',
      description: 'Second prompt',
      tags: ['ai', 'coding'],
      contentType: 'prompt',
      authorName: 'Willem Meints',
      url: '/content/prompts/another-prompt',
    })
  })

  it('exposes pageIndex and totalPages from response', async () => {
    vi.mocked(getAllContent).mockResolvedValue({
      ...mockContentPage,
      pageIndex: 2,
      totalPages: 5,
    })

    const { result } = mountComposable()
    result.fetchPage(2)
    await flushPromises()

    expect(result.pageIndex.value).toBe(2)
    expect(result.totalPages.value).toBe(5)
  })

  it('sets loading true during fetch and false after', async () => {
    let resolvePromise!: (value: ContentPageResponse) => void
    vi.mocked(getAllContent).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve
      }),
    )

    const { result } = mountComposable()
    expect(result.loading.value).toBe(false)

    result.fetchPage(0)
    expect(result.loading.value).toBe(true)

    resolvePromise(mockContentPage)
    await flushPromises()

    expect(result.loading.value).toBe(false)
  })

  it('sets error to true when fetch fails', async () => {
    vi.mocked(getAllContent).mockRejectedValue(new Error('Network error'))

    const { result } = mountComposable()
    result.fetchPage(0)
    await flushPromises()

    expect(result.error.value).toBe(true)
    expect(result.loading.value).toBe(false)
    expect(result.items.value).toEqual([])
  })

  it('clears error on successful subsequent fetch', async () => {
    vi.mocked(getAllContent).mockRejectedValueOnce(new Error('fail'))

    const { result } = mountComposable()
    result.fetchPage(0)
    await flushPromises()

    expect(result.error.value).toBe(true)

    vi.mocked(getAllContent).mockResolvedValueOnce(mockContentPage)
    result.fetchPage(0)
    await flushPromises()

    expect(result.error.value).toBe(false)
    expect(result.items.value).toHaveLength(2)
  })

  it('constructs correct URLs for different content types', async () => {
    const mixedContentPage: ContentPageResponse = {
      items: [
        {
          slug: 'my-prompt',
          title: 'A Prompt',
          description: 'Prompt desc',
          tags: [],
          contentType: 'prompt',
          author: { fullName: 'Willem Meints' },
          createdAt: '2026-02-20T10:00:00Z',
          modifiedAt: null,
        },
        {
          slug: 'my-skill',
          title: 'A Skill',
          description: 'Skill desc',
          tags: [],
          contentType: 'skill',
          author: { fullName: 'Willem Meints' },
          createdAt: '2026-02-19T10:00:00Z',
          modifiedAt: null,
        },
        {
          slug: 'my-agent',
          title: 'An Agent',
          description: 'Agent desc',
          tags: [],
          contentType: 'agent',
          author: { fullName: 'Willem Meints' },
          createdAt: '2026-02-18T10:00:00Z',
          modifiedAt: null,
        },
        {
          slug: 'my-workflow',
          title: 'A Workflow',
          description: 'Workflow desc',
          tags: [],
          contentType: 'workflow',
          author: { fullName: 'Willem Meints' },
          createdAt: '2026-02-17T10:00:00Z',
          modifiedAt: null,
        },
      ],
      pageIndex: 0,
      totalPages: 1,
    }

    vi.mocked(getAllContent).mockResolvedValue(mixedContentPage)

    const { result } = mountComposable()
    result.fetchPage(0)
    await flushPromises()

    expect(result.items.value[0].url).toBe('/content/prompts/my-prompt')
    expect(result.items.value[1].url).toBe('/content/skills/my-skill')
    expect(result.items.value[2].url).toBe('/content/agents/my-agent')
    expect(result.items.value[3].url).toBe('/content/workflows/my-workflow')
  })

  it('defaults pageIndex to 0 and totalPages to 0 before any fetch', () => {
    const { result } = mountComposable()

    expect(result.pageIndex.value).toBe(0)
    expect(result.totalPages.value).toBe(0)
  })
})
