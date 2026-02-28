import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import NavigationSearch from '../NavigationSearch.vue'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('NavigationSearch', () => {
  it('renders a search input', () => {
    const wrapper = mount(NavigationSearch)

    const input = wrapper.find('input[type="search"]')
    expect(input.exists()).toBe(true)
  })

  it('navigates to /search?q={query} on Enter (SC-001)', async () => {
    const wrapper = mount(NavigationSearch)

    const input = wrapper.find('input[type="search"]')
    await input.setValue('kotlin')

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(mockPush).toHaveBeenCalledWith({ path: '/search', query: { q: 'kotlin' } })
  })

  it('does not navigate when input is empty', async () => {
    const wrapper = mount(NavigationSearch)

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('does not navigate when input is whitespace only', async () => {
    const wrapper = mount(NavigationSearch)

    const input = wrapper.find('input[type="search"]')
    await input.setValue('   ')

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('trims the query before navigating', async () => {
    const wrapper = mount(NavigationSearch)

    const input = wrapper.find('input[type="search"]')
    await input.setValue('  kotlin  ')

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(mockPush).toHaveBeenCalledWith({ path: '/search', query: { q: 'kotlin' } })
  })
})
