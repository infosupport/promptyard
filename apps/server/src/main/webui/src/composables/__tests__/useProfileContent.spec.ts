import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { MyContentPageResponse } from '@/services/profiles'

vi.mock('@/services/profiles', () => ({
  getProfileContent: vi.fn(),
}))

import { getProfileContent } from '@/services/profiles'
import { useProfileContent } from '../useProfileContent'

const mockContentPage: MyContentPageResponse = {
  items: [
    {
      slug: 'my-prompt',
      title: 'My First Prompt',
      description: 'A test prompt',
      tags: ['testing'],
      contentType: 'prompt',
      authorName: 'Willem Meints',
      createdAt: '2026-02-20T10:00:00Z',
      modifiedAt: null,
    },
    {
      slug: 'another-prompt',
      title: 'Another Prompt',
      description: 'Second prompt',
      tags: ['ai', 'coding'],
      contentType: 'prompt',
      authorName: 'Willem Meints',
      createdAt: '2026-02-18T10:00:00Z',
      modifiedAt: null,
    },
  ],
  pageIndex: 0,
  totalPages: 1,
}

type UseProfileContentReturn = ReturnType<typeof useProfileContent>

function mountComposable(slug: string = 'willem-meints') {
  let result!: UseProfileContentReturn

  const wrapper = mount(
    defineComponent({
      setup() {
        result = useProfileContent(slug)
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

describe('useProfileContent', () => {
  it('fetches content on mount with page 0 for the given slug', async () => {
    vi.mocked(getProfileContent).mockResolvedValue(mockContentPage)

    mountComposable('willem-meints')
    await flushPromises()

    expect(getProfileContent).toHaveBeenCalledWith('willem-meints', 0)
  })

  it('sets loading to true initially and false after fetch', async () => {
    vi.mocked(getProfileContent).mockResolvedValue(mockContentPage)

    const { result } = mountComposable()
    expect(result.loading.value).toBe(true)

    await flushPromises()
    expect(result.loading.value).toBe(false)
  })

  it('maps response items to ContentItemSummary', async () => {
    vi.mocked(getProfileContent).mockResolvedValue(mockContentPage)

    const { result } = mountComposable()
    await flushPromises()

    expect(result.items.value).toHaveLength(2)
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
    vi.mocked(getProfileContent).mockResolvedValue({
      ...mockContentPage,
      pageIndex: 2,
      totalPages: 5,
    })

    const { result } = mountComposable()
    await flushPromises()

    expect(result.pageIndex.value).toBe(2)
    expect(result.totalPages.value).toBe(5)
  })

  it('sets error to true when fetch fails', async () => {
    vi.mocked(getProfileContent).mockRejectedValue(new Error('Network error'))

    const { result } = mountComposable()
    await flushPromises()

    expect(result.error.value).toBe(true)
    expect(result.loading.value).toBe(false)
    expect(result.items.value).toEqual([])
  })

  it('fetches a specific page when fetchPage is called', async () => {
    const page2: MyContentPageResponse = {
      items: [
        {
          slug: 'old-prompt',
          title: 'Old Prompt',
          description: 'An older prompt',
          tags: [],
          contentType: 'prompt',
          authorName: 'Willem Meints',
          createdAt: '2026-01-01T10:00:00Z',
          modifiedAt: null,
        },
      ],
      pageIndex: 1,
      totalPages: 2,
    }

    vi.mocked(getProfileContent)
      .mockResolvedValueOnce({ ...mockContentPage, totalPages: 2 })
      .mockResolvedValueOnce(page2)

    const { result } = mountComposable()
    await flushPromises()

    result.fetchPage(1)
    await flushPromises()

    expect(getProfileContent).toHaveBeenCalledTimes(2)
    expect(getProfileContent).toHaveBeenLastCalledWith('willem-meints', 1)
    expect(result.pageIndex.value).toBe(1)
    expect(result.totalPages.value).toBe(2)
    expect(result.items.value).toHaveLength(1)
    expect(result.items.value[0]!.title).toBe('Old Prompt')
  })

  it('constructs correct URLs for different content types', async () => {
    const mixedContentPage: MyContentPageResponse = {
      items: [
        {
          slug: 'my-prompt',
          title: 'A Prompt',
          description: 'Prompt desc',
          tags: [],
          contentType: 'prompt',
          authorName: 'Willem Meints',
          createdAt: '2026-02-20T10:00:00Z',
          modifiedAt: null,
        },
        {
          slug: 'my-skill',
          title: 'A Skill',
          description: 'Skill desc',
          tags: [],
          contentType: 'skill',
          authorName: 'Willem Meints',
          createdAt: '2026-02-19T10:00:00Z',
          modifiedAt: null,
        },
        {
          slug: 'my-agent',
          title: 'An Agent',
          description: 'Agent desc',
          tags: [],
          contentType: 'agent',
          authorName: 'Willem Meints',
          createdAt: '2026-02-18T10:00:00Z',
          modifiedAt: null,
        },
        {
          slug: 'my-workflow',
          title: 'A Workflow',
          description: 'Workflow desc',
          tags: [],
          contentType: 'workflow',
          authorName: 'Willem Meints',
          createdAt: '2026-02-17T10:00:00Z',
          modifiedAt: null,
        },
      ],
      pageIndex: 0,
      totalPages: 1,
    }

    vi.mocked(getProfileContent).mockResolvedValue(mixedContentPage)

    const { result } = mountComposable()
    await flushPromises()

    expect(result.items.value[0]!.url).toBe('/content/prompts/my-prompt')
    expect(result.items.value[1]!.url).toBe('/content/skills/my-skill')
    expect(result.items.value[2]!.url).toBe('/content/agents/my-agent')
    expect(result.items.value[3]!.url).toBe('/content/workflows/my-workflow')
  })

  it('clears error when a subsequent fetch succeeds', async () => {
    vi.mocked(getProfileContent).mockRejectedValueOnce(new Error('fail'))

    const { result } = mountComposable()
    await flushPromises()

    expect(result.error.value).toBe(true)

    vi.mocked(getProfileContent).mockResolvedValueOnce(mockContentPage)
    result.fetchPage(0)
    await flushPromises()

    expect(result.error.value).toBe(false)
    expect(result.items.value).toHaveLength(2)
  })
})
