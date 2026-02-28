import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContentItemCard from '../ContentItemCard.vue'
import { CONTENT_TYPE_CONFIG, CONTENT_TYPES, type ContentType } from '@/lib/content-types'

const defaultProps = {
  title: 'My Prompt',
  description: 'A useful prompt for code reviews',
  tags: ['kotlin', 'review'],
  contentType: 'prompt' as ContentType,
  authorName: 'Jane Doe',
  url: '/prompts/my-prompt',
}

function mountCard(propsOverride: Partial<typeof defaultProps> = {}, slots = {}) {
  return mount(ContentItemCard, {
    props: { ...defaultProps, ...propsOverride },
    slots,
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

describe('ContentItemCard', () => {
  // SC-001: Card displays content item summary
  it('renders title, description, tag badges, and author name', () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('My Prompt')
    expect(wrapper.text()).toContain('A useful prompt for code reviews')
    expect(wrapper.text()).toContain('kotlin')
    expect(wrapper.text()).toContain('review')
    expect(wrapper.text()).toContain('Jane Doe')
  })

  // SC-002: Long description truncated to 3 lines
  it('applies line-clamp-3 class to description', () => {
    const wrapper = mountCard()
    const description = wrapper.find('p.line-clamp-3')

    expect(description.exists()).toBe(true)
    expect(description.text()).toBe('A useful prompt for code reviews')
  })

  // SC-003 & SC-004: Content type shown with colored border and icon
  for (const type of CONTENT_TYPES) {
    it(`renders correct border color and icon for content type "${type}"`, () => {
      const wrapper = mountCard({ contentType: type as ContentType })
      const config = CONTENT_TYPE_CONFIG[type]

      // Check border color class on the card root
      const card = wrapper.find('[data-slot="card"]')
      expect(card.classes()).toContain(config.borderColor)

      // Check icon aria-label
      const icon = wrapper.find(`[aria-label="${config.label}"]`)
      expect(icon.exists()).toBe(true)
    })
  }

  // SC-005: Title navigates to content item detail
  it('renders title as a link with the correct href', () => {
    const wrapper = mountCard()
    const link = wrapper.find('a[href="/prompts/my-prompt"]')

    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('My Prompt')
  })

  // SC-006: Actions rendered via slot
  it('renders actions when actions slot is provided', () => {
    const wrapper = mountCard({}, { actions: '<button>Edit</button>' })

    const header = wrapper.find('[data-slot="card-header"]')
    expect(header.text()).toContain('Edit')
  })

  // SC-007: Footer hidden when no actions provided
  it('does not render footer when no actions slot is provided', () => {
    const wrapper = mountCard()

    const footer = wrapper.find('[data-slot="card-footer"]')
    expect(footer.exists()).toBe(false)
  })

  // EC-1: Empty tags list
  it('does not render tags section when tags array is empty', () => {
    const wrapper = mountCard({ tags: [] })

    const badges = wrapper.findAll('[data-slot="badge"]')
    expect(badges.length).toBe(0)

    // Should not show "+0 more" indicator
    expect(wrapper.text()).not.toContain('more')
  })

  // EC-4: Empty description
  it('does not render description section when description is empty', () => {
    const wrapper = mountCard({ description: '' })

    const descriptionP = wrapper.find('p.line-clamp-3')
    expect(descriptionP.exists()).toBe(false)
  })

  // EC-5: Actions slot with multiple action buttons
  it('renders multiple action buttons in actions slot', () => {
    const wrapper = mountCard(
      {},
      { actions: '<button>Edit</button><button>Delete</button>' },
    )

    const header = wrapper.find('[data-slot="card-header"]')
    const buttons = header.findAll('button')
    expect(buttons.length).toBe(2)
    expect(buttons[0]!.text()).toBe('Edit')
    expect(buttons[1]!.text()).toBe('Delete')
  })

  // Verify tags container ref exists for tag overflow composable wiring
  it('renders tags container element when tags are present', () => {
    const wrapper = mountCard({ tags: ['kotlin', 'review', 'testing'] })

    // The tags container should exist with badges inside
    const badges = wrapper.findAll('[data-slot="badge"]')
    expect(badges.length).toBe(3)
  })

  it('renders author name in all configurations', () => {
    const wrapper = mountCard({ authorName: 'John Smith' })

    expect(wrapper.text()).toContain('John Smith')
  })

  it('applies border-t-2 class for the colored top border', () => {
    const wrapper = mountCard()
    const card = wrapper.find('[data-slot="card"]')

    expect(card.classes()).toContain('border-t-2')
  })
})
