import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useProfileStore } from '@/stores/profile'
import type { ContentItemSummary } from '@/lib/content-types'
import type { UserProfile } from '@/services/profiles'
import ProfileView from '../ProfileView.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { slug: 'willem-meints' } }),
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: {
    name: 'RouterLink',
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
}))

vi.mock('@/services/profiles', () => ({
  getProfileBySlug: vi.fn(),
}))

import { getProfileBySlug } from '@/services/profiles'

const mockContentItems = ref<ContentItemSummary[]>([])
const mockContentPageIndex = ref(0)
const mockContentTotalPages = ref(0)
const mockContentLoading = ref(false)
const mockContentError = ref(false)
const mockFetchContentPage = vi.fn()

vi.mock('@/composables/useProfileContent', () => ({
  useProfileContent: () => ({
    items: mockContentItems,
    pageIndex: mockContentPageIndex,
    totalPages: mockContentTotalPages,
    loading: mockContentLoading,
    error: mockContentError,
    fetchPage: mockFetchContentPage,
  }),
}))

const mockProfile: UserProfile = {
  id: 1,
  slug: 'willem-meints',
  fullName: 'Willem Meints',
  emailAddress: 'willem@example.com',
  businessUnit: 'Unit AI & Data',
  jobTitle: 'Machine Learning Engineer',
  privacyAcceptedAt: '2024-01-15T00:00:00Z',
  createdAt: '2024-01-15T00:00:00Z',
  modifiedAt: null,
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

function mountView() {
  return mount(ProfileView, {
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

function setStoreProfile(slug: string = 'willem-meints') {
  const store = useProfileStore()
  store.setProfile({
    id: 1,
    slug,
    fullName: 'Willem Meints',
    emailAddress: 'willem@example.com',
    businessUnit: 'Unit AI & Data',
    jobTitle: 'Machine Learning Engineer',
    privacyAcceptedAt: '2024-01-15T00:00:00Z',
    createdAt: '2024-01-15T00:00:00Z',
    modifiedAt: null,
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  mockContentItems.value = []
  mockContentPageIndex.value = 0
  mockContentTotalPages.value = 0
  mockContentLoading.value = false
  mockContentError.value = false
})

describe('ProfileView', () => {
  it('renders breadcrumb with user full name', async () => {
    vi.mocked(getProfileBySlug).mockResolvedValue(mockProfile)
    setStoreProfile()

    const wrapper = mountView()
    await flushPromises()

    const nav = wrapper.find('nav[aria-label="Breadcrumb"]')
    expect(nav.exists()).toBe(true)
    expect(nav.text()).toContain('Profiles')
    expect(nav.text()).toContain('Willem Meints')
  })

  it('passes correct props to ProfileDetailsCard', async () => {
    vi.mocked(getProfileBySlug).mockResolvedValue(mockProfile)
    setStoreProfile()

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
  })

  it('sets showEditButton to false when viewing another user', async () => {
    vi.mocked(getProfileBySlug).mockResolvedValue(mockProfile)
    // Store has a different slug than the route
    setStoreProfile('other-user')

    const wrapper = mountView()
    await flushPromises()

    const card = wrapper.findComponent({ name: 'ProfileDetailsCard' })
    expect(card.props('showEditButton')).toBe(false)
    expect(card.props('editUrl')).toBeUndefined()
  })

  it('sets showEditButton to true when viewing own profile', async () => {
    vi.mocked(getProfileBySlug).mockResolvedValue(mockProfile)
    // Store slug matches route slug
    setStoreProfile('willem-meints')

    const wrapper = mountView()
    await flushPromises()

    const card = wrapper.findComponent({ name: 'ProfileDetailsCard' })
    expect(card.props('showEditButton')).toBe(true)
    expect(card.props('editUrl')).toBe('/profiles/me/edit')
  })

  it('passes content items to ContentItemList', async () => {
    vi.mocked(getProfileBySlug).mockResolvedValue(mockProfile)
    mockContentItems.value = sampleItems
    mockContentPageIndex.value = 0
    mockContentTotalPages.value = 1
    setStoreProfile()

    const wrapper = mountView()
    await flushPromises()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    expect(list.props('items')).toHaveLength(2)
    expect(list.props('items')[0]).toEqual(sampleItems[0])
    expect(list.props('pageIndex')).toBe(0)
    expect(list.props('totalPages')).toBe(1)
  })

  it('shows loading state while profile is being fetched', () => {
    vi.mocked(getProfileBySlug).mockReturnValue(new Promise(() => {}))
    setStoreProfile()

    const wrapper = mountView()

    expect(wrapper.text()).toContain('Loading...')
  })

  it('shows not-found state when profile fetch returns 404', async () => {
    vi.mocked(getProfileBySlug).mockRejectedValue(
      new Error('Failed to fetch profile: 404'),
    )
    setStoreProfile()

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Profile not found')
    const homeLink = wrapper.find('a[href="/"]')
    expect(homeLink.exists()).toBe(true)
    expect(homeLink.text()).toContain('Back to home')
  })

  it('shows error state on network error', async () => {
    vi.mocked(getProfileBySlug).mockRejectedValue(new Error('Network error'))
    setStoreProfile()

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Something went wrong')
    const retryButton = wrapper.find('button')
    expect(retryButton.text()).toBe('Retry')
  })

  it('calls fetchPage on page-change event from ContentItemList', async () => {
    vi.mocked(getProfileBySlug).mockResolvedValue(mockProfile)
    mockContentItems.value = sampleItems
    mockContentTotalPages.value = 2
    setStoreProfile()

    const wrapper = mountView()
    await flushPromises()

    const list = wrapper.findComponent({ name: 'ContentItemList' })
    list.vm.$emit('page-change', 1)
    await flushPromises()

    expect(mockFetchContentPage).toHaveBeenCalledWith(1)
  })

  it('passes undefined for optional profile fields when null', async () => {
    vi.mocked(getProfileBySlug).mockResolvedValue({
      ...mockProfile,
      jobTitle: null,
      businessUnit: null,
    })
    setStoreProfile()

    const wrapper = mountView()
    await flushPromises()

    const card = wrapper.findComponent({ name: 'ProfileDetailsCard' })
    expect(card.props('jobTitle')).toBeUndefined()
    expect(card.props('businessUnit')).toBeUndefined()
  })
})
