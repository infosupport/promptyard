import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EditProfileView from '../EditProfileView.vue'
import { useProfileStore } from '@/stores/profile'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  onBeforeRouteLeave: vi.fn(),
  RouterLink: {
    name: 'RouterLink',
    template: '<a><slot /></a>',
    props: ['to'],
  },
}))

vi.mock('@/services/profiles', () => ({
  getCurrentProfile: vi.fn(),
  updateProfile: vi.fn(),
}))

vi.mock('@/composables/useUnsavedChanges', () => ({
  useUnsavedChanges: vi.fn(() => ({
    showDialog: ref(false),
    confirmLeave: vi.fn(),
    cancelLeave: vi.fn(),
    bypass: vi.fn(),
  })),
}))

import { updateProfile } from '@/services/profiles'

const mockProfileData = {
  id: 1,
  slug: 'john-doe',
  fullName: 'John Doe',
  emailAddress: 'john@example.com',
  businessUnit: 'Engineering',
  jobTitle: 'Developer',
  privacyAcceptedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  modifiedAt: null,
}

interface ExposedForm {
  setFieldValue: (field: string, value: unknown) => void
  validate: () => Promise<{ valid: boolean }>
}

interface ExposedVm {
  form: ExposedForm
  onSubmit: (e?: Event) => Promise<void>
  submitting: boolean
  apiError: string
}

function mountView() {
  return mount(EditProfileView, {
    global: {
      stubs: {
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

  const profileStore = useProfileStore()
  profileStore.setProfile(mockProfileData)
})

describe('EditProfileView', () => {
  it('renders form with pre-populated data', () => {
    const wrapper = mountView()

    const inputs = wrapper.findAll('input[type="text"]')
    expect(inputs.length).toBe(2)
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('Developer')
    expect((inputs[1]!.element as HTMLInputElement).value).toBe('Engineering')
  })

  it('shows read-only name and email', () => {
    const wrapper = mountView()

    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('john@example.com')
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Email')
  })

  it('renders breadcrumb with expected segments', () => {
    const wrapper = mountView()

    const breadcrumb = wrapper.find('nav[aria-label="Breadcrumb"]')
    expect(breadcrumb.exists()).toBe(true)
    expect(breadcrumb.text()).toContain('Promptyard')
    expect(breadcrumb.text()).toContain('Profiles')
    expect(breadcrumb.text()).toContain('Me')
    expect(breadcrumb.text()).toContain('Edit Details')
  })

  it('submits updated data and navigates to my-profile', async () => {
    vi.mocked(updateProfile).mockResolvedValue(undefined)

    const wrapper = mountView()
    const { form, onSubmit } = getVm(wrapper)

    form.setFieldValue('jobTitle', 'Senior Engineer')
    form.setFieldValue('businessUnit', 'R&D')
    await flushPromises()

    await onSubmit()
    await flushPromises()

    expect(vi.mocked(updateProfile)).toHaveBeenCalledWith({
      jobTitle: 'Senior Engineer',
      businessUnit: 'R&D',
    })
    expect(mockPush).toHaveBeenCalledWith({ name: 'my-profile' })
  })

  it('submits empty strings as null', async () => {
    vi.mocked(updateProfile).mockResolvedValue(undefined)

    const wrapper = mountView()
    const { form, onSubmit } = getVm(wrapper)

    form.setFieldValue('jobTitle', '')
    form.setFieldValue('businessUnit', '')
    await flushPromises()

    await onSubmit()
    await flushPromises()

    expect(vi.mocked(updateProfile)).toHaveBeenCalledWith({
      jobTitle: null,
      businessUnit: null,
    })
  })

  it('shows error on API failure', async () => {
    vi.mocked(updateProfile).mockRejectedValue(new Error('Server error'))

    const wrapper = mountView()
    const { onSubmit } = getVm(wrapper)

    await onSubmit()
    await flushPromises()

    expect(wrapper.text()).toContain(
      'Something went wrong while saving your profile. Please try again.',
    )
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('cancel navigates to my-profile', async () => {
    const wrapper = mountView()

    const cancelButton = wrapper.findAll('button').find((b) => b.text() === 'Cancel')
    expect(cancelButton).toBeDefined()

    await cancelButton!.trigger('click')

    expect(mockPush).toHaveBeenCalledWith({ name: 'my-profile' })
  })

  it('shows saving state during submission', async () => {
    let resolvePromise: () => void
    const updateCalled = new Promise<void>((resolveCall) => {
      vi.mocked(updateProfile).mockImplementation(() => {
        resolveCall()
        return new Promise((resolve) => {
          resolvePromise = resolve
        })
      })
    })

    const wrapper = mountView()
    const { onSubmit } = getVm(wrapper)

    const submitPromise = onSubmit()
    await updateCalled
    await nextTick()

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.text()).toBe('Saving...')
    expect(submitButton.attributes('disabled')).toBeDefined()

    resolvePromise!()
    await submitPromise
    await flushPromises()

    expect(wrapper.find('button[type="submit"]').text()).toBe('Save')
  })
})
