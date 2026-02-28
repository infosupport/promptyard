import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContentItemList from '../ContentItemList.vue'
import type { ContentItemSummary } from '@/lib/content-types'

function createItems(count: number): ContentItemSummary[] {
  const contentTypes = ['prompt', 'skill', 'agent', 'workflow'] as const
  return Array.from({ length: count }, (_, i) => ({
    title: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
    tags: ['tag-a', 'tag-b'],
    contentType: contentTypes[i % contentTypes.length]!,
    authorName: `Author ${i + 1}`,
    url: `/items/item-${i + 1}`,
  }))
}

const defaultProps = {
  items: createItems(5),
  pageIndex: 0,
  totalPages: 3,
  loading: false,
}

function mountList(propsOverride: Partial<typeof defaultProps> = {}) {
  return mount(ContentItemList, {
    props: { ...defaultProps, ...propsOverride },
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

describe('ContentItemList', () => {
  // SC-001: List renders content item cards (FR-001, FR-002)
  it('renders content item cards for each item', () => {
    const items = createItems(5)
    const wrapper = mountList({ items })

    const cards = wrapper.findAll('[data-slot="card"]')
    expect(cards).toHaveLength(5)

    for (const [i, item] of items.entries()) {
      expect(cards[i]!.text()).toContain(item.title)
    }
  })

  // SC-002: Pager displays page numbers and arrows, current page highlighted
  it('renders pagination with page numbers, arrows, and highlights current page', () => {
    const wrapper = mountList({ pageIndex: 1, totalPages: 5 })

    const pagination = wrapper.find('[data-slot="pagination"]')
    expect(pagination.exists()).toBe(true)

    // Current page (2, one-based) should have the active/outline variant
    const activeItem = wrapper.find('[data-slot="pagination-item"][data-selected]')
    expect(activeItem.exists()).toBe(true)
    expect(activeItem.text()).toContain('2')

    // Prev and next buttons exist
    expect(wrapper.find('[data-slot="pagination-previous"]').exists()).toBe(true)
    expect(wrapper.find('[data-slot="pagination-next"]').exists()).toBe(true)
  })

  // SC-003: Prev arrow disabled on first page (FR-005)
  it('disables prev arrow on the first page', () => {
    const wrapper = mountList({ pageIndex: 0, totalPages: 5 })

    const prev = wrapper.find('[data-slot="pagination-previous"]')
    expect(prev.attributes('disabled')).toBeDefined()

    const next = wrapper.find('[data-slot="pagination-next"]')
    expect(next.attributes('disabled')).toBeUndefined()
  })

  // SC-004: Next arrow disabled on last page (FR-006)
  it('disables next arrow on the last page', () => {
    const wrapper = mountList({ pageIndex: 4, totalPages: 5 })

    const next = wrapper.find('[data-slot="pagination-next"]')
    expect(next.attributes('disabled')).toBeDefined()

    const prev = wrapper.find('[data-slot="pagination-previous"]')
    expect(prev.attributes('disabled')).toBeUndefined()
  })

  // SC-005: Clicking a page number emits page-change event (zero-based) (FR-007)
  it('emits page-change with zero-based index when clicking a page number', async () => {
    const wrapper = mountList({ pageIndex: 0, totalPages: 5 })

    // Find the page button with text "3"
    const pageItems = wrapper.findAll('[data-slot="pagination-item"]')
    const page3 = pageItems.find((item) => item.text().trim() === '3')
    expect(page3).toBeDefined()

    await page3!.trigger('click')

    expect(wrapper.emitted('page-change')).toBeTruthy()
    expect(wrapper.emitted('page-change')![0]).toEqual([2])
  })

  // SC-006: Clicking next arrow emits page-change event (FR-007)
  it('emits page-change when clicking the next arrow', async () => {
    const wrapper = mountList({ pageIndex: 0, totalPages: 5 })

    const next = wrapper.find('[data-slot="pagination-next"]')
    await next.trigger('click')

    expect(wrapper.emitted('page-change')).toBeTruthy()
    expect(wrapper.emitted('page-change')![0]).toEqual([1])
  })

  // SC-007: Clicking prev arrow emits page-change event (FR-007)
  it('emits page-change when clicking the prev arrow', async () => {
    const wrapper = mountList({ pageIndex: 2, totalPages: 5 })

    const prev = wrapper.find('[data-slot="pagination-previous"]')
    await prev.trigger('click')

    expect(wrapper.emitted('page-change')).toBeTruthy()
    expect(wrapper.emitted('page-change')![0]).toEqual([1])
  })

  // SC-008: Total item count not displayed (FR-008)
  it('does not display total item count', () => {
    const items = createItems(15)
    const wrapper = mountList({ items, totalPages: 3 })

    const text = wrapper.text()
    expect(text).not.toContain('15 items')
    expect(text).not.toContain('15 results')
  })

  // SC-009: Loading state shows skeleton cards, no content, no pager (FR-009)
  it('shows skeleton cards and hides content and pager when loading', () => {
    const wrapper = mountList({ loading: true })

    // Skeleton elements should be present
    const skeletons = wrapper.findAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)

    // No content cards should be rendered (skeleton cards have [data-slot="card"]
    // but no ContentItemCard-specific content like author names)
    expect(wrapper.text()).not.toContain('Author 1')

    // No pagination should be rendered
    expect(wrapper.find('[data-slot="pagination"]').exists()).toBe(false)
  })

  // SC-010: Empty state shows "No content items found", no pager (FR-010)
  it('shows empty message and hides pager when items array is empty', () => {
    const wrapper = mountList({ items: [], loading: false })

    expect(wrapper.text()).toContain('No content items found')
    expect(wrapper.find('[data-slot="pagination"]').exists()).toBe(false)
  })

  // SC-011: Pager truncates with ellipsis for many pages (FR-011)
  it('shows ellipsis when there are many pages', () => {
    const wrapper = mountList({ pageIndex: 0, totalPages: 20 })

    const pageItems = wrapper.findAll('[data-slot="pagination-item"]')
    // With 20 pages and sibling-count=1, not all pages are shown
    expect(pageItems.length).toBeLessThan(20)

    const ellipsis = wrapper.findAll('[data-slot="pagination-ellipsis"]')
    expect(ellipsis.length).toBeGreaterThan(0)
  })

  // SC-012: Pager hidden when only one page (FR-003)
  it('hides pagination when there is only one page', () => {
    const wrapper = mountList({ totalPages: 1 })

    // Cards should still render
    const cards = wrapper.findAll('[data-slot="card"]')
    expect(cards.length).toBeGreaterThan(0)

    // No pagination
    expect(wrapper.find('[data-slot="pagination"]').exists()).toBe(false)
  })

  // EC-3: Loading true with stale items shows skeleton, not items
  it('shows skeleton instead of stale items when loading is true', () => {
    const wrapper = mountList({ loading: true, items: createItems(5) })

    const skeletons = wrapper.findAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)

    // Should not show any item content
    expect(wrapper.text()).not.toContain('Item 1')
    expect(wrapper.text()).not.toContain('Author 1')
  })

  // EC-4: Clicking active page does not emit
  it('does not emit page-change when clicking the already active page', async () => {
    const wrapper = mountList({ pageIndex: 0, totalPages: 5 })

    // Find the page button for page 1 (the active page)
    const pageItems = wrapper.findAll('[data-slot="pagination-item"]')
    const page1 = pageItems.find((item) => item.text().trim() === '1')
    expect(page1).toBeDefined()

    await page1!.trigger('click')

    expect(wrapper.emitted('page-change')).toBeUndefined()
  })

  // EC-6: Loading transitions to false with empty items
  it('transitions from loading to empty state', async () => {
    const wrapper = mountList({ loading: true, items: [] })

    // Initially shows skeleton
    expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)

    // Transition to loaded with empty items
    await wrapper.setProps({ loading: false })

    expect(wrapper.text()).toContain('No content items found')
    expect(wrapper.findAll('[data-slot="skeleton"]').length).toBe(0)
  })

  // Empty state uses role="status" for accessibility
  it('renders empty state with role="status" for screen readers', () => {
    const wrapper = mountList({ items: [], loading: false })

    const statusEl = wrapper.find('[role="status"]')
    expect(statusEl.exists()).toBe(true)
    expect(statusEl.text()).toContain('No content items found')
  })
})
