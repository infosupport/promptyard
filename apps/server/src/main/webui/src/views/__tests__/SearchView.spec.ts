import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import type { ContentItemSummary } from '@/lib/content-types'
import SearchView from '../SearchView.vue'

const mockRoute = { query: {} as Record<string, string> }
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ push: mockPush }),
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
const mockSearch = vi.fn()

vi.mock('@/composables/useSearch', () => ({
  useSearch: () => ({
    items: mockItems,
    pageIndex: mockPageIndex,
    totalPages: mockTotalPages,
    loading: mockLoading,
    error: mockError,
    search: mockSearch,
  }),
}))

function mountView() {
  return mount(SearchView, {
    global: {
      stubs: {
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
    title: 'Kotlin Best Practices',
    description: 'A prompt about Kotlin',
    tags: ['kotlin'],
    contentType: 'prompt',
    authorName: 'Willem Meints',
    url: '/content/prompts/kotlin-prompt',
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

describe('SearchView', () => {
  it('shows empty state when no query is provided (SC-008)', () => {
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Enter a search term')
    expect(mockSearch).not.toHaveBeenCalled()
  })

  it('shows empty state when query is empty string (SC-009)', () => {
    mockRoute.query = { q: '' }

    const wrapper = mountView()

    expect(wrapper.text()).toContain('Enter a search term')
    expect(mockSearch).not.toHaveBeenCalled()
  })

  it('shows empty state when query is whitespace only (EC-1)', () => {
    mockRoute.query = { q: '   ' }

    const wrapper = mountView()

    expect(wrapper.text()).toContain('Enter a search term')
    expect(mockSearch).not.toHaveBeenCalled()
  })

  it('calls search with query and page 0 when q is provided (FR-008)', () => {
    mockRoute.query = { q: 'kotlin' }

    mountView()

    expect(mockSearch).toHaveBeenCalledWith('kotlin', 0)
  })

  it('pre-fills search input with query from URL (SC-004)', () => {
    mockRoute.query = { q: 'kotlin' }

    const wrapper = mountView()
    const input = wrapper.find('input[type="search"]')

    expect((input.element as HTMLInputElement).value).toBe('kotlin')
  })

  it('calls search with correct page when page param is provided (SC-007)', () => {
    mockRoute.query = { q: 'kotlin', page: '2' }

    mountView()

    expect(mockSearch).toHaveBeenCalledWith('kotlin', 1)
  })

  it('treats invalid page param as page 0 (EC-5)', () => {
    mockRoute.query = { q: 'kotlin', page: 'abc' }

    mountView()

    expect(mockSearch).toHaveBeenCalledWith('kotlin', 0)
  })

  it('treats negative page param as page 0 (EC-5)', () => {
    mockRoute.query = { q: 'kotlin', page: '-1' }

    mountView()

    expect(mockSearch).toHaveBeenCalledWith('kotlin', 0)
  })

  it('treats page=0 as page 0 (EC-5)', () => {
    mockRoute.query = { q: 'kotlin', page: '0' }

    mountView()

    expect(mockSearch).toHaveBeenCalledWith('kotlin', 0)
  })

  it('shows ContentItemList with results (SC-002)', async () => {
    mockRoute.query = { q: 'kotlin' }
    mockItems.value = sampleItems
    mockTotalPages.value = 1

    const wrapper = mountView()
    await flushPromises()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    expect(list.exists()).toBe(true)
    expect(list.props('items')).toEqual(sampleItems)
  })

  it('shows no results message when query returns empty results (SC-010)', async () => {
    mockRoute.query = { q: 'xyznonexistent' }
    mockItems.value = []
    mockLoading.value = false

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('No results found')
    expect(wrapper.text()).toContain('xyznonexistent')
  })

  it('shows error message when search fails (EC-3)', async () => {
    mockRoute.query = { q: 'kotlin' }
    mockError.value = true

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Search failed')
  })

  it('navigates to /search?q={query} on form submit (SC-005)', async () => {
    mockRoute.query = { q: 'kotlin' }

    const wrapper = mountView()
    const input = wrapper.find('input[type="search"]')
    await input.setValue('quarkus')

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(mockPush).toHaveBeenCalledWith({ path: '/search', query: { q: 'quarkus' } })
  })

  it('does not navigate on submit when input is empty', async () => {
    const wrapper = mountView()

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not navigate on submit when input is whitespace only', async () => {
    const wrapper = mountView()
    const input = wrapper.find('input[type="search"]')
    await input.setValue('   ')

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('updates URL with page param on page-change (SC-006)', async () => {
    mockRoute.query = { q: 'kotlin' }
    mockItems.value = sampleItems
    mockTotalPages.value = 3

    const wrapper = mountView()
    await flushPromises()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    list.vm.$emit('page-change', 1)
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith({
      path: '/search',
      query: { q: 'kotlin', page: '2' },
    })
  })

  it('removes page param from URL when navigating to page 1 (FR-007)', async () => {
    mockRoute.query = { q: 'kotlin', page: '2' }
    mockItems.value = sampleItems
    mockTotalPages.value = 3

    const wrapper = mountView()
    await flushPromises()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    list.vm.$emit('page-change', 0)
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith({ path: '/search', query: { q: 'kotlin' } })
  })

  it('passes loading prop to ContentItemList', async () => {
    mockRoute.query = { q: 'kotlin' }
    mockLoading.value = true

    const wrapper = mountView()
    await flushPromises()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    expect(list.props('loading')).toBe(true)
  })

  it('has an accessible search input with aria-label (NFR-004)', () => {
    const wrapper = mountView()
    const input = wrapper.find('input[type="search"]')

    expect(input.attributes('aria-label')).toBe('Search content')
  })
})
