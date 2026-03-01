import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('marked', () => ({
  marked: {
    parse: (md: string) =>
      `<h1>Privacy Statement</h1><p>${md.substring(0, 50)}</p>`,
  },
}))

vi.mock('@docs/legal/privacy-statement.md?raw', () => ({
  default: '# Privacy Statement RAISE Knowledge Platform\n\nDit privacy statement legt uit hoe het platform omgaat met jouw persoonsgegevens.',
}))

import PrivacyView from '../PrivacyView.vue'

describe('PrivacyView', () => {
  function mountView() {
    return mount(PrivacyView)
  }

  it('renders an article element with prose class', () => {
    const wrapper = mountView()

    const article = wrapper.find('article')
    expect(article.exists()).toBe(true)
    expect(article.classes()).toContain('prose')
  })

  it('renders the markdown content as HTML', () => {
    const wrapper = mountView()

    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.text()).toContain('Privacy Statement')
  })

  it('uses v-html to render the parsed markdown', () => {
    const wrapper = mountView()

    const article = wrapper.find('article')
    expect(article.html()).toContain('<h1>')
    expect(article.html()).toContain('<p>')
  })
})
