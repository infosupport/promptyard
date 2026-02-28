import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { PromptDetailResponse } from '@/services/prompts'
import PromptDetailView from '../PromptDetailView.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { slug: 'test-prompt' } }),
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: {
    name: 'RouterLink',
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
}))

vi.mock('@/services/prompts', () => ({
  getPromptBySlug: vi.fn(),
}))

import { getPromptBySlug } from '@/services/prompts'

const mockPrompt: PromptDetailResponse = {
  title: 'Code Review Checklist',
  slug: 'code-review-checklist',
  description: 'A structured checklist for thorough code reviews',
  content: '# Code Review\n\n- Check for errors\n- Check for style',
  tags: ['review', 'kotlin'],
  contentType: 'prompt',
  createdAt: '2026-01-15T10:00:00Z',
  modifiedAt: null,
  author: {
    fullName: 'Jane Doe',
    jobTitle: 'Senior Engineer',
    profileSlug: 'jane-doe',
    promptCount: 12,
    skillCount: 3,
    agentCount: 0,
    workflowCount: 1,
  },
  isOwner: false,
}

function mountView() {
  return mount(PromptDetailView, {
    global: {
      stubs: {
        AppBreadcrumb: {
          name: 'AppBreadcrumb',
          template: '<nav aria-label="Breadcrumb"><template v-for="s in segments" :key="s.label"><a v-if="s.to" :href="s.to">{{ s.label }}</a><span v-else>{{ s.label }}</span></template></nav>',
          props: ['segments'],
        },
        MonacoEditor: {
          name: 'MonacoEditor',
          template: '<div data-testid="monaco-stub" />',
          props: ['modelValue', 'disabled'],
        },
        AuthorCard: {
          name: 'AuthorCard',
          template: '<div data-testid="author-card" />',
          props: [
            'fullName',
            'jobTitle',
            'promptCount',
            'skillCount',
            'agentCount',
            'workflowCount',
            'profileUrl',
          ],
        },
        RouterLink: {
          template: '<a :href="to"><slot /></a>',
          props: ['to'],
        },
      },
    },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('PromptDetailView', () => {
  it('shows loading state while fetching', () => {
    vi.mocked(getPromptBySlug).mockReturnValue(new Promise(() => {}))

    const wrapper = mountView()

    expect(wrapper.text()).toContain('Loading...')
  })

  it('renders prompt metadata after loading', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Code Review Checklist')
    expect(wrapper.text()).toContain('A structured checklist for thorough code reviews')
    expect(wrapper.text()).toContain('review')
    expect(wrapper.text()).toContain('kotlin')
  })

  it('renders tags as badges', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)

    const wrapper = mountView()
    await flushPromises()

    const badges = wrapper.findAll('[data-slot="badge"]')
    expect(badges.length).toBe(2)
    expect(badges[0].text()).toBe('review')
    expect(badges[1].text()).toBe('kotlin')
  })

  it('passes correct props to MonacoEditor', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)

    const wrapper = mountView()
    await flushPromises()

    const editor = wrapper.findComponent({ name: 'MonacoEditor' })
    expect(editor.props('modelValue')).toBe(mockPrompt.content)
    expect(editor.props('disabled')).toBe(true)
  })

  it('renders copy button with accessible label', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)

    const wrapper = mountView()
    await flushPromises()

    const copyButton = wrapper.find('button[aria-label="Copy prompt content to clipboard"]')
    expect(copyButton.exists()).toBe(true)
    expect(copyButton.text()).toContain('Copy')
  })

  it('passes correct props to AuthorCard', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)

    const wrapper = mountView()
    await flushPromises()

    const authorCard = wrapper.findComponent({ name: 'AuthorCard' })
    expect(authorCard.props('fullName')).toBe('Jane Doe')
    expect(authorCard.props('jobTitle')).toBe('Senior Engineer')
    expect(authorCard.props('promptCount')).toBe(12)
    expect(authorCard.props('skillCount')).toBe(3)
    expect(authorCard.props('agentCount')).toBe(0)
    expect(authorCard.props('workflowCount')).toBe(1)
    expect(authorCard.props('profileUrl')).toBe('/profiles/jane-doe')
  })

  it('renders breadcrumb with correct segments', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)

    const wrapper = mountView()
    await flushPromises()

    const nav = wrapper.find('nav[aria-label="Breadcrumb"]')
    expect(nav.exists()).toBe(true)

    const homeLink = nav.find('a[href="/"]')
    expect(homeLink.exists()).toBe(true)
    expect(homeLink.text()).toBe('Promptyard')

    expect(nav.text()).toContain('Prompts')
    expect(nav.text()).toContain('Code Review Checklist')
  })

  it('shows not found state when API returns 404', async () => {
    vi.mocked(getPromptBySlug).mockRejectedValue(new Error('Failed to fetch prompt: 404'))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Prompt not found')
    const homeLink = wrapper.find('a[href="/"]')
    expect(homeLink.exists()).toBe(true)
    expect(homeLink.text()).toContain('Back to home')
  })

  it('shows error state on network error with retry button', async () => {
    vi.mocked(getPromptBySlug).mockRejectedValue(new Error('Network error'))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Something went wrong')
    const retryButton = wrapper.find('button')
    expect(retryButton.text()).toBe('Retry')
  })

  it('retries fetching when retry button is clicked', async () => {
    vi.mocked(getPromptBySlug)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockPrompt)

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Something went wrong')

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(vi.mocked(getPromptBySlug)).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Code Review Checklist')
  })

  it('hides description when it is empty', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue({
      ...mockPrompt,
      description: '',
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[data-slot="card-description"]').exists()).toBe(false)
  })

  it('hides tags section when tags are empty', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue({
      ...mockPrompt,
      tags: [],
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.findAll('[data-slot="badge"]').length).toBe(0)
  })

  it('passes undefined jobTitle to AuthorCard when author has no job title', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue({
      ...mockPrompt,
      author: { ...mockPrompt.author, jobTitle: null },
    })

    const wrapper = mountView()
    await flushPromises()

    const authorCard = wrapper.findComponent({ name: 'AuthorCard' })
    expect(authorCard.props('jobTitle')).toBeUndefined()
  })

  it('calls getPromptBySlug with the route slug', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)

    mountView()
    await flushPromises()

    expect(vi.mocked(getPromptBySlug)).toHaveBeenCalledWith('test-prompt')
  })

  it('copies prompt content to clipboard and shows Copied! feedback (SC-003)', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    const wrapper = mountView()
    await flushPromises()

    const copyButton = wrapper.find('button[aria-label="Copy prompt content to clipboard"]')
    await copyButton.trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith(mockPrompt.content)
    expect(copyButton.text()).toContain('Copied!')
  })

  it('displays error message near copy button when clipboard API fails (EC-4)', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard permission denied'))
    Object.assign(navigator, { clipboard: { writeText } })

    const wrapper = mountView()
    await flushPromises()

    const copyButton = wrapper.find('button[aria-label="Copy prompt content to clipboard"]')
    await copyButton.trigger('click')
    await flushPromises()

    const errorAlert = wrapper.find('p.text-destructive[role="alert"]')
    expect(errorAlert.exists()).toBe(true)
    expect(errorAlert.text()).toBe('Failed to copy to clipboard.')
    expect(copyButton.text()).toContain('Copy')
    expect(copyButton.text()).not.toContain('Copied!')
  })

  it('shows Edit action when current user is the owner', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue({
      ...mockPrompt,
      isOwner: true,
    })

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Edit')
  })

  it('hides Edit action when current user is not the owner', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue({
      ...mockPrompt,
      isOwner: false,
    })

    const wrapper = mountView()
    await flushPromises()

    // The first card (metadata) should not have an Edit action
    const allText = wrapper.find('[data-slot="card"]').text()
    // "Edit" should not be in the metadata card text (Copy is fine)
    expect(allText).not.toContain('Edit')
  })
})
