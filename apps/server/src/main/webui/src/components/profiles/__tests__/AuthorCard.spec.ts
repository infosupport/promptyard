import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthorCard from '../AuthorCard.vue'

const defaultProps = {
  fullName: 'Michael Sander',
  jobTitle: 'Senior Software Engineer',
  promptCount: 24,
  skillCount: 8,
  agentCount: 0,
  workflowCount: 0,
  profileUrl: '/profiles/michael-sander',
}

function mountCard(propsOverride: Partial<typeof defaultProps> = {}) {
  return mount(AuthorCard, {
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

describe('AuthorCard', () => {
  // SC-001: Card displays author summary (FR-001, FR-003, FR-004)
  it('renders avatar with initials, full name, and job title', () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('MS')
    expect(wrapper.text()).toContain('Michael Sander')
    expect(wrapper.text()).toContain('Senior Software Engineer')
  })

  // SC-001: Avatar has aria-label with full name (NFR-001)
  it('renders avatar with aria-label containing the full name', () => {
    const wrapper = mountCard()
    const avatar = wrapper.find('[aria-label="Michael Sander"]')

    expect(avatar.exists()).toBe(true)
  })

  // SC-002: Single-word name initials (FR-002)
  it('renders single initial for a single-word name', () => {
    const wrapper = mountCard({ fullName: 'Madonna' })

    expect(wrapper.text()).toContain('M')
    expect(wrapper.text()).toContain('Madonna')
  })

  // SC-003: Multi-part name initials (FR-002)
  it('renders first and last initials for a multi-part name', () => {
    const wrapper = mountCard({ fullName: 'Jan van der Berg' })
    const fallback = wrapper.find('[data-slot="avatar-fallback"]')

    expect(fallback.text()).toBe('JB')
  })

  // SC-004: Job title hidden when not set (FR-005)
  it('does not render job title when not provided', () => {
    const wrapper = mountCard({ jobTitle: undefined })

    expect(wrapper.text()).toContain('Michael Sander')
    expect(wrapper.text()).not.toContain('Senior Software Engineer')
  })

  // SC-005: Content counts displayed for all types (FR-006, FR-007)
  it('displays content counts for all four content types', () => {
    const wrapper = mountCard({
      promptCount: 24,
      skillCount: 8,
      agentCount: 0,
      workflowCount: 0,
    })

    expect(wrapper.text()).toContain('24')
    expect(wrapper.text()).toContain('Prompts')
    expect(wrapper.text()).toContain('8')
    expect(wrapper.text()).toContain('Skills')
    expect(wrapper.text()).toContain('Agents')
    expect(wrapper.text()).toContain('Workflows')
  })

  // SC-006: All content counts are zero (FR-007)
  it('displays zero counts without hiding them', () => {
    const wrapper = mountCard({
      promptCount: 0,
      skillCount: 0,
      agentCount: 0,
      workflowCount: 0,
    })

    // All four labels should be present
    expect(wrapper.text()).toContain('Prompts')
    expect(wrapper.text()).toContain('Skills')
    expect(wrapper.text()).toContain('Agents')
    expect(wrapper.text()).toContain('Workflows')

    // Check that "0" appears (at least 4 times for 4 stat entries)
    const zeroElements = wrapper.findAll('p').filter((p) => p.text() === '0')
    expect(zeroElements.length).toBe(4)
  })

  // SC-007: View Profile navigates to author profile (FR-008)
  it('renders a View Profile link with the correct href', () => {
    const wrapper = mountCard()
    const link = wrapper.find('a[href="/profiles/michael-sander"]')

    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('View Profile')
  })

  // FR-009: Built on shadcn/vue Card and Avatar
  it('renders within a shadcn/vue Card component', () => {
    const wrapper = mountCard()
    const card = wrapper.find('[data-slot="card"]')

    expect(card.exists()).toBe(true)
  })

  it('renders a shadcn/vue Avatar component', () => {
    const wrapper = mountCard()
    const avatar = wrapper.find('[data-slot="avatar"]')

    expect(avatar.exists()).toBe(true)
  })

  // FR-010: Avatar uses rounded-square shape
  it('renders avatar with rounded-lg class for rounded-square shape', () => {
    const wrapper = mountCard()
    const avatar = wrapper.find('[data-slot="avatar"]')

    expect(avatar.classes()).toContain('rounded-lg')
  })

  // EC-1: Very long name truncates
  it('truncates a very long name with title attribute', () => {
    const longName = 'Alexandra Konstantinidou-Papadopoulou von Hohenzollern'
    const wrapper = mountCard({ fullName: longName })

    const nameEl = wrapper.find(`p[title="${longName}"]`)
    expect(nameEl.exists()).toBe(true)
    expect(nameEl.classes()).toContain('truncate')
  })

  // NFR-002: View Profile button is keyboard-focusable
  it('renders View Profile as a link element (keyboard-focusable)', () => {
    const wrapper = mountCard()
    const link = wrapper.find('a[href="/profiles/michael-sander"]')

    expect(link.exists()).toBe(true)
  })
})
