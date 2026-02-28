import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useProfileStore } from '@/stores/profile'
import WelcomeView from '../WelcomeView.vue'
import type { UserProfile } from '@/services/profiles'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  RouterLink: {
    name: 'RouterLink',
    template: '<a><slot /></a>',
    props: ['to'],
  },
}))

vi.mock('@/services/profiles', () => ({
  createProfile: vi.fn(),
  getCurrentProfile: vi.fn(),
}))

import { createProfile, getCurrentProfile } from '@/services/profiles'

const mockProfile: UserProfile = {
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
}

function mountWelcomeView() {
  return mount(WelcomeView, {
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
})

describe('WelcomeView', () => {
  it('shows the onboarding form when no profile exists', () => {
    const wrapper = mountWelcomeView()

    expect(wrapper.text()).toContain('Welcome to Promptyard')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.text()).toContain('Job title')
    expect(wrapper.text()).toContain('Business unit')
    expect(wrapper.text()).toContain('privacy statement')
  })

  it('shows already-onboarded message when profile exists in store', () => {
    const store = useProfileStore()
    store.setProfile(mockProfile)

    const wrapper = mountWelcomeView()

    expect(wrapper.text()).toContain('already onboarded')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('does not call createProfile when privacy is not accepted', async () => {
    const wrapper = mountWelcomeView()
    const { form, onSubmit } = getVm(wrapper)

    // Submit without setting privacyAccepted to true
    await onSubmit()
    await flushPromises()

    const result = await form.validate()
    expect(result.valid).toBe(false)
    expect(vi.mocked(createProfile)).not.toHaveBeenCalled()
  })

  it('submits the form and redirects on success', async () => {
    vi.mocked(createProfile).mockResolvedValue({ slug: 'john-doe' })
    vi.mocked(getCurrentProfile).mockResolvedValue(mockProfile)

    const wrapper = mountWelcomeView()
    const { form, onSubmit } = getVm(wrapper)

    form.setFieldValue('jobTitle', 'Developer')
    form.setFieldValue('businessUnit', 'Engineering')
    form.setFieldValue('privacyAccepted', true)
    await flushPromises()

    await onSubmit()
    await flushPromises()

    expect(vi.mocked(createProfile)).toHaveBeenCalledWith({
      jobTitle: 'Developer',
      businessUnit: 'Engineering',
      privacyAccepted: true,
    })
    expect(mockPush).toHaveBeenCalledWith({ path: '/profiles/john-doe' })
  })

  it('shows error message on API failure during submission', async () => {
    vi.mocked(createProfile).mockRejectedValue(new Error('Server error'))

    const wrapper = mountWelcomeView()
    const { form, onSubmit } = getVm(wrapper)

    form.setFieldValue('privacyAccepted', true)
    await flushPromises()

    await onSubmit()
    await flushPromises()

    expect(wrapper.text()).toContain('Something went wrong while creating your profile')
    expect(mockPush).not.toHaveBeenCalled()

    const store = useProfileStore()
    expect(store.profile).toBeNull()
  })

  it('renders the get started button', () => {
    const wrapper = mountWelcomeView()
    const button = wrapper.find('button[type="submit"]')
    expect(button.exists()).toBe(true)
    expect(button.text()).toBe('Get started')
  })
})
