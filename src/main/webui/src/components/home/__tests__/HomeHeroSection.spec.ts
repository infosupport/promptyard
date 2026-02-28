import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HomeHeroSection from '../HomeHeroSection.vue'

vi.mock('vue-router', () => ({
  RouterLink: {
    name: 'RouterLink',
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
}))

function mountComponent() {
  return mount(HomeHeroSection, {
    global: {
      stubs: {
        NavigationCreateMenu: {
          name: 'NavigationCreateMenu',
          template: '<div data-testid="create-menu" />',
        },
        RouterLink: {
          template: '<a :href="to"><slot /></a>',
          props: ['to'],
        },
      },
    },
  })
}

describe('HomeHeroSection', () => {
  it('renders an h1 with the expected heading text', () => {
    const wrapper = mountComponent()

    const h1 = wrapper.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('Help your colleagues adopt AI')
  })

  it('renders the motivational message paragraph', () => {
    const wrapper = mountComponent()

    const p = wrapper.find('p')
    expect(p.exists()).toBe(true)
    expect(p.text()).toBe(
      'Share your prompts, skills, agents, and workflows with the rest of the organization.',
    )
  })

  it('renders NavigationCreateMenu component', () => {
    const wrapper = mountComponent()

    const menu = wrapper.findComponent({ name: 'NavigationCreateMenu' })
    expect(menu.exists()).toBe(true)
  })
})
