import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CreatePromptView from '../CreatePromptView.vue'

const mockPush = vi.fn()
const mockBack = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useRoute: () => ({ params: {} }),
  onBeforeRouteLeave: vi.fn(),
  RouterLink: {
    name: 'RouterLink',
    template: '<a><slot /></a>',
    props: ['to'],
  },
}))

vi.mock('@/services/prompts', () => ({
  createPrompt: vi.fn(),
}))

vi.mock('@/composables/useUnsavedChanges', () => ({
  useUnsavedChanges: vi.fn(() => ({
    showDialog: ref(false),
    confirmLeave: vi.fn(),
    cancelLeave: vi.fn(),
    bypass: vi.fn(),
  })),
}))

import { createPrompt } from '@/services/prompts'

interface ExposedForm {
  setFieldValue: (field: string, value: unknown) => void
  validate: () => Promise<{ valid: boolean }>
}

interface ExposedVm {
  form: ExposedForm
  onSubmit: (e?: Event) => Promise<void>
  submitting: boolean
}

function mountView() {
  return mount(CreatePromptView, {
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

describe('CreatePromptView', () => {
  it('renders the form with all fields', () => {
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Create Prompt')
    expect(wrapper.text()).toContain('Title')
    expect(wrapper.text()).toContain('Description')
    expect(wrapper.text()).toContain('Content')
    expect(wrapper.text()).toContain('Tags')
    expect(wrapper.find('button[type="submit"]').text()).toBe('Save')
    expect(wrapper.text()).toContain('Cancel')
  })

  it('submits successfully and navigates to prompt detail', async () => {
    vi.mocked(createPrompt).mockResolvedValue({ slug: 'my-prompt' })

    const wrapper = mountView()
    const { form, onSubmit } = getVm(wrapper)

    form.setFieldValue('title', 'My Prompt')
    form.setFieldValue('content', '# Hello World')
    form.setFieldValue('tags', ['kotlin', 'review'])
    await flushPromises()

    await onSubmit()
    await flushPromises()

    expect(vi.mocked(createPrompt)).toHaveBeenCalledWith({
      title: 'My Prompt',
      description: '',
      content: '# Hello World',
      tags: ['kotlin', 'review'],
    })
    expect(mockPush).toHaveBeenCalledWith({
      name: 'prompt-detail',
      params: { slug: 'my-prompt' },
    })
  })

  it('submits with description included in the request', async () => {
    vi.mocked(createPrompt).mockResolvedValue({ slug: 'my-prompt' })

    const wrapper = mountView()
    const { form, onSubmit } = getVm(wrapper)

    form.setFieldValue('title', 'My Prompt')
    form.setFieldValue('description', 'A helpful prompt')
    form.setFieldValue('content', '# Hello')
    form.setFieldValue('tags', ['kotlin'])
    await flushPromises()

    await onSubmit()
    await flushPromises()

    expect(vi.mocked(createPrompt)).toHaveBeenCalledWith({
      title: 'My Prompt',
      description: 'A helpful prompt',
      content: '# Hello',
      tags: ['kotlin'],
    })
  })

  it('submits without description as empty string', async () => {
    vi.mocked(createPrompt).mockResolvedValue({ slug: 'my-prompt' })

    const wrapper = mountView()
    const { form, onSubmit } = getVm(wrapper)

    form.setFieldValue('title', 'My Prompt')
    form.setFieldValue('content', '# Hello')
    form.setFieldValue('tags', ['kotlin'])
    await flushPromises()

    await onSubmit()
    await flushPromises()

    expect(vi.mocked(createPrompt)).toHaveBeenCalledWith(
      expect.objectContaining({ description: '' }),
    )
  })

  it('does not call createPrompt when required fields are empty', async () => {
    const wrapper = mountView()
    const { onSubmit } = getVm(wrapper)

    await onSubmit()
    await flushPromises()

    expect(vi.mocked(createPrompt)).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('validates that at least one tag is required', async () => {
    const wrapper = mountView()
    const { form, onSubmit } = getVm(wrapper)

    form.setFieldValue('title', 'My Prompt')
    form.setFieldValue('content', '# Hello')
    // tags left as empty array
    await flushPromises()

    await onSubmit()
    await flushPromises()

    expect(vi.mocked(createPrompt)).not.toHaveBeenCalled()
  })

  it('shows error message on API failure', async () => {
    vi.mocked(createPrompt).mockRejectedValue(new Error('Server error'))

    const wrapper = mountView()
    const { form, onSubmit } = getVm(wrapper)

    form.setFieldValue('title', 'My Prompt')
    form.setFieldValue('content', '# Hello')
    form.setFieldValue('tags', ['kotlin'])
    await flushPromises()

    await onSubmit()
    await flushPromises()

    expect(wrapper.text()).toContain('Something went wrong while creating the prompt')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows profile not found error on 404 response', async () => {
    vi.mocked(createPrompt).mockRejectedValue(new Error('Failed to create prompt: 404'))

    const wrapper = mountView()
    const { form, onSubmit } = getVm(wrapper)

    form.setFieldValue('title', 'My Prompt')
    form.setFieldValue('content', '# Hello')
    form.setFieldValue('tags', ['kotlin'])
    await flushPromises()

    await onSubmit()
    await flushPromises()

    expect(wrapper.text()).toContain('profile was not found')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows saving state during submission and restores after completion', async () => {
    let resolvePromise: (value: { slug: string }) => void
    const createPromptCalled = new Promise<void>((resolveCall) => {
      vi.mocked(createPrompt).mockImplementation(() => {
        resolveCall()
        return new Promise((resolve) => {
          resolvePromise = resolve
        })
      })
    })

    const wrapper = mountView()
    const { form, onSubmit } = getVm(wrapper)

    form.setFieldValue('title', 'My Prompt')
    form.setFieldValue('content', '# Hello')
    form.setFieldValue('tags', ['kotlin'])
    await flushPromises()

    // Start submit but don't await it
    const submitPromise = onSubmit()

    // Wait until createPrompt is actually called
    await createPromptCalled

    // Now let Vue re-render
    await nextTick()

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.text()).toBe('Saving...')
    expect(submitButton.attributes('disabled')).toBeDefined()

    resolvePromise!({ slug: 'my-prompt' })
    await submitPromise
    await flushPromises()

    // After completion, the button should be back to normal
    expect(wrapper.find('button[type="submit"]').text()).toBe('Save')
  })

  it('navigates back when cancel is clicked', async () => {
    const wrapper = mountView()

    const cancelButton = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
    expect(cancelButton).toBeDefined()

    await cancelButton!.trigger('click')

    expect(mockBack).toHaveBeenCalled()
  })
})
