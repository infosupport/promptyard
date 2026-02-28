import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContentItemListSkeleton from '../ContentItemListSkeleton.vue'

describe('ContentItemListSkeleton', () => {
  it('renders exactly 3 card containers', () => {
    const wrapper = mount(ContentItemListSkeleton)

    const cards = wrapper.findAll('[data-slot="card"]')
    expect(cards).toHaveLength(3)
  })

  it('renders skeleton elements within each card', () => {
    const wrapper = mount(ContentItemListSkeleton)

    const cards = wrapper.findAll('[data-slot="card"]')
    for (const card of cards) {
      const skeletons = card.findAll('[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    }
  })

  it('renders skeleton elements for title, description, tags, and author in each card', () => {
    const wrapper = mount(ContentItemListSkeleton)

    const cards = wrapper.findAll('[data-slot="card"]')
    for (const card of cards) {
      // Header: icon skeleton (rounded-full) + title skeleton
      const header = card.find('[data-slot="card-header"]')
      expect(header.exists()).toBe(true)
      expect(header.findAll('[data-slot="skeleton"]')).toHaveLength(2)

      // Content sections contain description, tags, and author skeletons
      const contentSections = card.findAll('[data-slot="card-content"]')
      expect(contentSections.length).toBeGreaterThanOrEqual(3)
    }
  })
})
