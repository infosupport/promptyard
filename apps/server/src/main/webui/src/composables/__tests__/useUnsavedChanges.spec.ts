import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import type { RouteLocationNormalized, NavigationGuard } from 'vue-router'

let guardCallback: NavigationGuard | null = null
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  onBeforeRouteLeave: (cb: NavigationGuard) => {
    guardCallback = cb
  },
}))

import { useUnsavedChanges } from '../useUnsavedChanges'

function createTestRoute(path: string): RouteLocationNormalized {
  return {
    path,
    name: undefined,
    params: {},
    query: {},
    hash: '',
    fullPath: path,
    matched: [],
    meta: {},
    redirectedFrom: undefined,
  }
}

let activeWrapper: VueWrapper | null = null

function mountComposable(isDirtyValue: boolean) {
  const isDirty = ref(isDirtyValue)

  let result: ReturnType<typeof useUnsavedChanges> | undefined

  const TestComponent = defineComponent({
    setup() {
      result = useUnsavedChanges(isDirty)
      return {}
    },
    template: '<div />',
  })

  const wrapper = mount(TestComponent)
  activeWrapper = wrapper

  return { isDirty, result: result!, wrapper }
}

beforeEach(() => {
  vi.clearAllMocks()
  guardCallback = null
})

afterEach(() => {
  if (activeWrapper) {
    activeWrapper.unmount()
    activeWrapper = null
  }
})

describe('useUnsavedChanges', () => {
  it('allows navigation when form is clean', () => {
    mountComposable(false)

    expect(guardCallback).not.toBeNull()

    const to = createTestRoute('/other')
    const from = createTestRoute('/current')
    const returnValue = guardCallback!(to, from, vi.fn())

    expect(returnValue).toBe(true)
  })

  it('blocks navigation and shows dialog when form is dirty', () => {
    const { result } = mountComposable(true)

    expect(guardCallback).not.toBeNull()

    const to = createTestRoute('/other')
    const from = createTestRoute('/current')
    const returnValue = guardCallback!(to, from, vi.fn())

    expect(returnValue).toBe(false)
    expect(result.showDialog.value).toBe(true)
  })

  it('navigates to pending route on confirmLeave', () => {
    const { result } = mountComposable(true)

    const to = createTestRoute('/other')
    const from = createTestRoute('/current')
    guardCallback!(to, from, vi.fn())

    expect(result.showDialog.value).toBe(true)

    result.confirmLeave()

    expect(result.showDialog.value).toBe(false)
    expect(mockPush).toHaveBeenCalledWith(to)
  })

  it('closes dialog on cancelLeave without navigating', () => {
    const { result } = mountComposable(true)

    const to = createTestRoute('/other')
    const from = createTestRoute('/current')
    guardCallback!(to, from, vi.fn())

    expect(result.showDialog.value).toBe(true)

    result.cancelLeave()

    expect(result.showDialog.value).toBe(false)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('calls event.preventDefault on beforeunload when dirty', () => {
    mountComposable(true)

    const event = new Event('beforeunload')
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    window.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('does not call event.preventDefault on beforeunload when clean', () => {
    mountComposable(false)

    const event = new Event('beforeunload')
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    window.dispatchEvent(event)

    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  it('removes beforeunload listener on unmount', () => {
    const { wrapper } = mountComposable(true)

    wrapper.unmount()
    activeWrapper = null

    const event = new Event('beforeunload')
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    window.dispatchEvent(event)

    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  it('allows navigation after bypass is called', () => {
    const { result } = mountComposable(true)

    result.bypass()

    const to = createTestRoute('/other')
    const from = createTestRoute('/current')
    const returnValue = guardCallback!(to, from, vi.fn())

    expect(returnValue).toBe(true)
    expect(result.showDialog.value).toBe(false)
  })

  it('confirmLeave bypasses the guard for the subsequent navigation', () => {
    const { result } = mountComposable(true)

    const to = createTestRoute('/other')
    const from = createTestRoute('/current')
    guardCallback!(to, from, vi.fn())

    result.confirmLeave()

    // The guard should now allow navigation since confirmLeave sets bypassing
    const returnValue = guardCallback!(to, from, vi.fn())
    expect(returnValue).toBe(true)
  })
})
