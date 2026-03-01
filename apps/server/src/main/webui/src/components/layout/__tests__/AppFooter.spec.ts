import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFooter from '../AppFooter.vue'

describe('AppFooter', () => {
  function mountComponent() {
    return mount(AppFooter, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })
  }

  it('renders a footer element', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('footer').exists()).toBe(true)
  })

  it('contains a link to the privacy page', () => {
    const wrapper = mountComponent()

    const link = wrapper.find('a[href="/privacy"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('Privacy statement')
  })
})
