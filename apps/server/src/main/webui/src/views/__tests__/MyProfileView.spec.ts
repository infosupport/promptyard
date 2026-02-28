import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useProfileStore } from '@/stores/profile'
import type { ContentItemSummary } from '@/lib/content-types'
import MyProfileView from '../MyProfileView.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {} }),
  useRouter: () => ({ push: vi.fn() }),
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

vi.mock('@/composables/useMyContent', () => ({
  useMyContent: () => ({
    items: mockItems,
    pageIndex: mockPageIndex,
    totalPages: mockTotalPages,
    loading: mockLoading,
    error: mockError,
    fetchPage: mockFetchPage,
  }),
}))

function mountView() {
  return mount(MyProfileView, {
    global: {
      stubs: {
        AppBreadcrumb: {
          name: 'AppBreadcrumb',
          template: '<nav aria-label="Breadcrumb"><span v-for="s in segments" :key="s.label">{{ s.label }}</span></nav>',
          props: ['segments'],
        },
        ProfileDetailsCard: {
          name: 'ProfileDetailsCard',
          template: '<div data-testid="profile-details-card" />',
          props: [
            'fullName',
            'jobTitle',
            'businessUnit',
            'memberSince',
            'promptCount',
            'skillCount',
            'agentCount',
            'workflowCount',
            'showEditButton',
            'editUrl',
          ],
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

function setProfileInStore() {
  const store = useProfileStore()
  store.setProfile({
    id: 1,
    slug: 'willem-meints',
    fullName: 'Willem Meints',
    emailAddress: 'willem@example.com',
    businessUnit: 'Unit AI & Data',
    jobTitle: 'Machine Learning Engineer',
    privacyAcceptedAt: '2024-01-15T00:00:00Z',
    createdAt: '2024-01-15T00:00:00Z',
    modifiedAt: null,
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
  {
    title: 'Another Prompt',
    description: 'Second prompt',
    tags: ['ai', 'coding'],
    contentType: 'prompt',
    authorName: 'Willem Meints',
    url: '/content/prompts/another-prompt',
  },
]

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  mockItems.value = []
  mockPageIndex.value = 0
  mockTotalPages.value = 0
  mockLoading.value = false
  mockError.value = false
})

describe('MyProfileView', () => {
  it('renders breadcrumb with Profiles / Me segments', async () => {
    setProfileInStore()

    const wrapper = mountView()
    await flushPromises()

    const nav = wrapper.find('nav[aria-label="Breadcrumb"]')
    expect(nav.exists()).toBe(true)
    expect(nav.text()).toContain('Profiles')
    expect(nav.text()).toContain('Me')
  })

  it('passes correct props to ProfileDetailsCard', async () => {
    setProfileInStore()

    const wrapper = mountView()
    await flushPromises()

    const card = wrapper.findComponent({ name: 'ProfileDetailsCard' })
    expect(card.exists()).toBe(true)
    expect(card.props('fullName')).toBe('Willem Meints')
    expect(card.props('jobTitle')).toBe('Machine Learning Engineer')
    expect(card.props('businessUnit')).toBe('Unit AI & Data')
    expect(card.props('memberSince')).toBe('2024-01-15T00:00:00Z')
    expect(card.props('promptCount')).toBe(0)
    expect(card.props('skillCount')).toBe(0)
    expect(card.props('agentCount')).toBe(0)
    expect(card.props('workflowCount')).toBe(0)
    expect(card.props('showEditButton')).toBe(true)
    expect(card.props('editUrl')).toBe('/profiles/me/edit')
  })

  it('shows ContentItemList with loading true while fetching', () => {
    mockLoading.value = true
    setProfileInStore()

    const wrapper = mountView()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    expect(list.props('loading')).toBe(true)
  })

  it('passes items to ContentItemList after loading', async () => {
    mockItems.value = sampleItems
    mockPageIndex.value = 0
    mockTotalPages.value = 1
    setProfileInStore()

    const wrapper = mountView()
    await flushPromises()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    expect(list.props('loading')).toBe(false)
    expect(list.props('pageIndex')).toBe(0)
    expect(list.props('totalPages')).toBe(1)

    const items = list.props('items')
    expect(items).toHaveLength(2)
    expect(items[0]).toEqual(sampleItems[0])
    expect(items[1]).toEqual(sampleItems[1])
  })

  it('calls fetchPage when page-change event is emitted', async () => {
    mockItems.value = sampleItems
    mockTotalPages.value = 2
    setProfileInStore()

    const wrapper = mountView()
    await flushPromises()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    list.vm.$emit('page-change', 1)
    await flushPromises()

    expect(mockFetchPage).toHaveBeenCalledWith(1)
  })

  it('does not render ProfileDetailsCard when profile is null', async () => {
    const wrapper = mountView()
    await flushPromises()

    const card = wrapper.findComponent({ name: 'ProfileDetailsCard' })
    expect(card.exists()).toBe(false)
  })

  it('passes undefined for optional profile fields when null', async () => {
    const store = useProfileStore()
    store.setProfile({
      id: 1,
      slug: 'test-user',
      fullName: 'Test User',
      emailAddress: 'test@example.com',
      businessUnit: null,
      jobTitle: null,
      privacyAcceptedAt: '2024-01-15T00:00:00Z',
      createdAt: '2024-01-15T00:00:00Z',
      modifiedAt: null,
    })

    const wrapper = mountView()
    await flushPromises()

    const card = wrapper.findComponent({ name: 'ProfileDetailsCard' })
    expect(card.props('jobTitle')).toBeUndefined()
    expect(card.props('businessUnit')).toBeUndefined()
  })

  it('passes empty items when composable has no data', async () => {
    setProfileInStore()

    const wrapper = mountView()
    await flushPromises()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    expect(list.props('items')).toEqual([])
  })
})
