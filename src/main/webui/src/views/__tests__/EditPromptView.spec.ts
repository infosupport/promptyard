import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EditPromptView from '../EditPromptView.vue'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => ({ params: { slug: 'test-prompt' } }),
  onBeforeRouteLeave: vi.fn(),
  RouterLink: {
    name: 'RouterLink',
    template: '<a><slot /></a>',
    props: ['to'],
  },
}))

vi.mock('@/services/prompts', () => ({
  getPromptBySlug: vi.fn(),
  updatePrompt: vi.fn(),
}))

vi.mock('@/composables/useUnsavedChanges', () => ({
  useUnsavedChanges: vi.fn(() => ({
    showDialog: ref(false),
    confirmLeave: vi.fn(),
    cancelLeave: vi.fn(),
    bypass: vi.fn(),
  })),
}))

import { getPromptBySlug, updatePrompt } from '@/services/prompts'

const mockPrompt = {
  title: 'Code Review Checklist',
  slug: 'code-review-checklist',
  description: 'A structured checklist',
  content: '# Code Review\n\n- Check for errors',
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
  isOwner: true,
}

interface ExposedForm {
  setFieldValue: (field: string, value: unknown) => void
  validate: () => Promise<{ valid: boolean }>
}

interface ExposedVm {
  form: ExposedForm
  onSubmit: (e?: Event) => Promise<void>
  submitting: boolean
  loading: boolean
  notFound: boolean
  loadError: string
  apiError: string
  fetchPrompt: () => Promise<void>
}

function mountView() {
  return mount(EditPromptView, {
    global: {
      stubs: {
        MonacoEditor: {
          name: 'MonacoEditor',
          template:
            '<textarea data-testid="monaco-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          props: ['modelValue'],
          emits: ['update:modelValue'],
        },
        RouterLink: {
          template: '<a><slot /></a>',
          props: ['to'],
        },
      },
    },
  })
}

function getVm(wrapper: ReturnType<typeof mount>): ExposedVm {
  return wrapper.vm as unknown as ExposedVm
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('EditPromptView', () => {
  it('shows loading state while fetching', () => {
    vi.mocked(getPromptBySlug).mockReturnValue(new Promise(() => {}))

    const wrapper = mountView()

    expect(wrapper.text()).toContain('Loading...')
  })

  it('renders the form with pre-populated data after loading', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Edit Prompt')
    expect(wrapper.text()).toContain('Title')
    expect(wrapper.text()).toContain('Description')
    expect(wrapper.text()).toContain('Content')
    expect(wrapper.text()).toContain('Tags')
    expect(wrapper.find('button[type="submit"]').text()).toBe('Save')
    expect(wrapper.text()).toContain('Cancel')
  })

  it('pre-populates form fields from the fetched prompt', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)

    const wrapper = mountView()
    await flushPromises()

    const { form } = getVm(wrapper)
    expect(form).toBeDefined()

    // The form values should match the fetched prompt
    const titleInput = wrapper.find('input[type="text"]')
    expect((titleInput.element as HTMLInputElement).value).toBe('Code Review Checklist')

    const textarea = wrapper.find('textarea:not([data-testid="monaco-stub"])')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('A structured checklist')
  })

  it('calls getPromptBySlug with the route slug', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)

    mountView()
    await flushPromises()

    expect(vi.mocked(getPromptBySlug)).toHaveBeenCalledWith('test-prompt')
  })

  it('shows not found state when prompt does not exist', async () => {
    vi.mocked(getPromptBySlug).mockRejectedValue(new Error('Failed to fetch prompt: 404'))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Prompt not found')
  })

  it('shows error state on load failure with retry', async () => {
    vi.mocked(getPromptBySlug).mockRejectedValue(new Error('Network error'))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('Something went wrong while loading the prompt')
    expect(wrapper.find('button').text()).toBe('Retry')
  })

  it('retries loading when retry button is clicked', async () => {
    vi.mocked(getPromptBySlug)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockPrompt)

    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(vi.mocked(getPromptBySlug)).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Edit Prompt')
  })

  it('submits updated data and navigates to detail page', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)
    vi.mocked(updatePrompt).mockResolvedValue({ slug: 'test-prompt' })

    const wrapper = mountView()
    await flushPromises()

    const { form, onSubmit } = getVm(wrapper)

    form.setFieldValue('title', 'Updated Title')
    await flushPromises()

    await onSubmit()
    await flushPromises()

    expect(vi.mocked(updatePrompt)).toHaveBeenCalledWith('test-prompt', {
      title: 'Updated Title',
      description: 'A structured checklist',
      content: '# Code Review\n\n- Check for errors',
      tags: ['review', 'kotlin'],
    })
    expect(mockPush).toHaveBeenCalledWith({
      name: 'prompt-detail',
      params: { slug: 'test-prompt' },
    })
  })

  it('does not submit when required fields are empty', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)

    const wrapper = mountView()
    await flushPromises()

    const { form, onSubmit } = getVm(wrapper)

    form.setFieldValue('title', '')
    form.setFieldValue('content', '')
    form.setFieldValue('tags', [])
    await flushPromises()

    await onSubmit()
    await flushPromises()

    expect(vi.mocked(updatePrompt)).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows error on 403 (permission denied)', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)
    vi.mocked(updatePrompt).mockRejectedValue(new Error('Failed to update prompt: 403'))

    const wrapper = mountView()
    await flushPromises()

    const { onSubmit } = getVm(wrapper)
    await onSubmit()
    await flushPromises()

    expect(wrapper.text()).toContain('You do not have permission to edit this prompt')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows error on 404 (prompt deleted)', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)
    vi.mocked(updatePrompt).mockRejectedValue(new Error('Failed to update prompt: 404'))

    const wrapper = mountView()
    await flushPromises()

    const { onSubmit } = getVm(wrapper)
    await onSubmit()
    await flushPromises()

    expect(wrapper.text()).toContain('This prompt no longer exists')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows generic error on API failure', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)
    vi.mocked(updatePrompt).mockRejectedValue(new Error('Server error'))

    const wrapper = mountView()
    await flushPromises()

    const { onSubmit } = getVm(wrapper)
    await onSubmit()
    await flushPromises()

    expect(wrapper.text()).toContain('Something went wrong while saving the prompt')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows saving state during submission', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)

    let resolvePromise: (value: { slug: string }) => void
    const updateCalled = new Promise<void>((resolveCall) => {
      vi.mocked(updatePrompt).mockImplementation(() => {
        resolveCall()
        return new Promise((resolve) => {
          resolvePromise = resolve
        })
      })
    })

    const wrapper = mountView()
    await flushPromises()

    const { onSubmit } = getVm(wrapper)
    const submitPromise = onSubmit()
    await updateCalled
    await nextTick()

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.text()).toBe('Saving...')
    expect(submitButton.attributes('disabled')).toBeDefined()

    resolvePromise!({ slug: 'test-prompt' })
    await submitPromise
    await flushPromises()

    expect(wrapper.find('button[type="submit"]').text()).toBe('Save')
  })

  it('navigates to detail page when cancel is clicked', async () => {
    vi.mocked(getPromptBySlug).mockResolvedValue(mockPrompt)

    const wrapper = mountView()
    await flushPromises()

    const cancelButton = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
    expect(cancelButton).toBeDefined()

    await cancelButton!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith({
      name: 'prompt-detail',
      params: { slug: 'test-prompt' },
    })
  })
})
