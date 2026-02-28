import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import type { ContentItemSummary } from '@/lib/content-types'
import HomeView from '../HomeView.vue'

const mockRoute = { query: {} as Record<string, string> }
const mockReplace = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ replace: mockReplace }),
  RouterLink: {
    name: 'RouterLink',
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
}))

const mockItems = ref<ContentItemSummary[]>([])
const mockPageIndex = ref(0)
const mockTotalPages = ref(0)
const mockLoading = ref(false)
const mockError = ref(false)
const mockFetchPage = vi.fn()

vi.mock('@/composables/useAllContent', () => ({
  useAllContent: () => ({
    items: mockItems,
    pageIndex: mockPageIndex,
    totalPages: mockTotalPages,
    loading: mockLoading,
    error: mockError,
    fetchPage: mockFetchPage,
  }),
}))

function mountView() {
  return mount(HomeView, {
    global: {
      stubs: {
        HomeHeroSection: {
          name: 'HomeHeroSection',
          template: '<div data-testid="hero-section" />',
        },
        ContentItemList: {
          name: 'ContentItemList',
          template: '<div data-testid="content-item-list" />',
          props: ['items', 'pageIndex', 'totalPages', 'loading'],
          emits: ['page-change'],
        },
        RouterLink: {
          template: '<a :href="to"><slot /></a>',
          props: ['to'],
        },
      },
    },
  })
}

const sampleItems: ContentItemSummary[] = [
  {
    title: 'My First Prompt',
    description: 'A test prompt',
    tags: ['testing'],
    contentType: 'prompt',
    authorName: 'Willem Meints',
    url: '/content/prompts/my-prompt',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockRoute.query = {}
  mockItems.value = []
  mockPageIndex.value = 0
  mockTotalPages.value = 0
  mockLoading.value = false
  mockError.value = false
})

describe('HomeView', () => {
  it('renders HomeHeroSection component (SC-001)', () => {
    const wrapper = mountView()

    const hero = wrapper.findComponent({ name: 'HomeHeroSection' })
    expect(hero.exists()).toBe(true)
  })

  it('calls fetchPage(0) when no page query param (SC-003)', () => {
    mountView()

    expect(mockFetchPage).toHaveBeenCalledWith(0)
  })

  it('shows ContentItemList with loading true while fetching (SC-004)', () => {
    mockLoading.value = true

    const wrapper = mountView()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    expect(list.props('loading')).toBe(true)
  })

  it('calls fetchPage(1) when URL has ?page=2 (SC-005)', () => {
    mockRoute.query = { page: '2' }

    mountView()

    expect(mockFetchPage).toHaveBeenCalledWith(1)
  })

  it('calls fetchPage and updates URL via router.replace on page-change (SC-006)', async () => {
    mockItems.value = sampleItems
    mockTotalPages.value = 3

    const wrapper = mountView()
    await flushPromises()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    list.vm.$emit('page-change', 2)
    await flushPromises()

    expect(mockFetchPage).toHaveBeenCalledWith(2)
    expect(mockReplace).toHaveBeenCalledWith({ query: { page: '3' } })
  })

  it('removes page param from URL when navigating to page 1 (SC-003)', async () => {
    mockItems.value = sampleItems
    mockTotalPages.value = 3

    const wrapper = mountView()
    await flushPromises()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    list.vm.$emit('page-change', 0)
    await flushPromises()

    expect(mockFetchPage).toHaveBeenCalledWith(0)
    expect(mockReplace).toHaveBeenCalledWith({ query: {} })
  })

  it('passes empty items to ContentItemList for empty state (SC-007)', async () => {
    const wrapper = mountView()
    await flushPromises()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    expect(list.props('items')).toEqual([])
  })

  it('defaults to page index 0 for invalid page param like ?page=-1 (SC-008)', () => {
    mockRoute.query = { page: '-1' }

    mountView()

    expect(mockFetchPage).toHaveBeenCalledWith(0)
  })

  it('defaults to page index 0 for non-numeric page param like ?page=abc (EC-2)', () => {
    mockRoute.query = { page: 'abc' }

    mountView()

    expect(mockFetchPage).toHaveBeenCalledWith(0)
  })

  it('defaults to page index 0 for ?page=0 (EC-4)', () => {
    mockRoute.query = { page: '0' }

    mountView()

    expect(mockFetchPage).toHaveBeenCalledWith(0)
  })

  it('shows error message when error ref is true, hero still visible (EC-6)', async () => {
    mockError.value = true

    const wrapper = mountView()
    await flushPromises()

    const hero = wrapper.findComponent({ name: 'HomeHeroSection' })
    expect(hero.exists()).toBe(true)

    expect(wrapper.text()).toContain('Failed to load content')

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    expect(list.exists()).toBe(false)
  })

  it('passes items and pagination props to ContentItemList after loading', async () => {
    mockItems.value = sampleItems
    mockPageIndex.value = 1
    mockTotalPages.value = 3

    const wrapper = mountView()
    await flushPromises()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    expect(list.props('items')).toEqual(sampleItems)
    expect(list.props('pageIndex')).toBe(1)
    expect(list.props('totalPages')).toBe(3)
    expect(list.props('loading')).toBe(false)
  })
})
