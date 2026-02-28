import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProfileDetailsCard from '../ProfileDetailsCard.vue'
import { CONTENT_TYPE_CONFIG } from '@/lib/content-types'

const defaultProps = {
  fullName: 'Willem Meints',
  jobTitle: 'Machine Learning Engineer',
  businessUnit: 'Unit AI & Data',
  memberSince: '2024-01-15T10:30:00Z',
  promptCount: 12,
  skillCount: 5,
  agentCount: 0,
  workflowCount: 3,
  showEditButton: true,
  editUrl: '/profiles/me/edit',
}

function mountCard(propsOverride: Partial<typeof defaultProps> = {}) {
  return mount(ProfileDetailsCard, {
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

describe('ProfileDetailsCard', () => {
  // SC-001: Full profile summary displayed (FR-003, FR-004, FR-005, FR-006)
  it('renders name, job title, business unit, and member since', () => {
    const wrapper = mountCard()

    expect(wrapper.text()).toContain('Willem Meints')
    expect(wrapper.text()).toContain('Machine Learning Engineer')
    expect(wrapper.text()).toContain('Unit AI & Data')
    expect(wrapper.text()).toContain('Member since Jan 2024')
  })

  // SC-002: Job title hidden when not set (FR-004)
  it('does not render job title when not provided', () => {
    const wrapper = mountCard({ jobTitle: undefined })

    expect(wrapper.text()).toContain('Willem Meints')
    expect(wrapper.text()).toContain('Member since Jan 2024')
    expect(wrapper.text()).not.toContain('Machine Learning Engineer')

    // No Briefcase icon parent span in the metadata row
    const metadataRow = wrapper.find('[data-testid="metadata-row"]')
    const spans = metadataRow.findAll('span')
    const hasBriefcaseSpan = spans.some((s) => s.text().includes('Machine Learning Engineer'))
    expect(hasBriefcaseSpan).toBe(false)
  })

  // SC-003: Business unit hidden when not set (FR-005)
  it('does not render business unit when not provided', () => {
    const wrapper = mountCard({ businessUnit: undefined })

    expect(wrapper.text()).toContain('Willem Meints')
    expect(wrapper.text()).toContain('Member since Jan 2024')
    expect(wrapper.text()).not.toContain('Unit AI & Data')
  })

  // SC-004: Both job title and business unit hidden (FR-004, FR-005)
  it('shows only membership date when both job title and business unit are absent', () => {
    const wrapper = mountCard({ jobTitle: undefined, businessUnit: undefined })
    const metadataRow = wrapper.find('[data-testid="metadata-row"]')

    // Only the membership date span should be a direct child span
    const directSpans = metadataRow.findAll(':scope > span')
    expect(directSpans.length).toBe(1)
    expect(directSpans[0]!.text()).toContain('Member since Jan 2024')
  })

  // SC-005: Content counts displayed (FR-007, FR-008)
  it('displays content counts with labels and distinct colors', () => {
    const wrapper = mountCard({
      promptCount: 12,
      skillCount: 5,
      agentCount: 0,
      workflowCount: 3,
    })

    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain('5')
    expect(wrapper.text()).toContain('0')
    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('Prompts')
    expect(wrapper.text()).toContain('Skills')
    expect(wrapper.text()).toContain('Agents')
    expect(wrapper.text()).toContain('Workflows')

    // Verify distinct color classes from CONTENT_TYPE_CONFIG
    const countElements = wrapper.findAll('[data-testid="stat-count"]')
    expect(countElements.length).toBe(4)
    expect(countElements[0]!.classes()).toContain(CONTENT_TYPE_CONFIG.prompt.iconColor)
    expect(countElements[1]!.classes()).toContain(CONTENT_TYPE_CONFIG.skill.iconColor)
    expect(countElements[2]!.classes()).toContain(CONTENT_TYPE_CONFIG.agent.iconColor)
    expect(countElements[3]!.classes()).toContain(CONTENT_TYPE_CONFIG.workflow.iconColor)
  })

  // SC-006: All counts are zero (FR-007, FR-008)
  it('displays zero counts without hiding them', () => {
    const wrapper = mountCard({
      promptCount: 0,
      skillCount: 0,
      agentCount: 0,
      workflowCount: 0,
    })

    expect(wrapper.text()).toContain('Prompts')
    expect(wrapper.text()).toContain('Skills')
    expect(wrapper.text()).toContain('Agents')
    expect(wrapper.text()).toContain('Workflows')

    const countElements = wrapper.findAll('[data-testid="stat-count"]')
    expect(countElements.length).toBe(4)
    countElements.forEach((el) => {
      expect(el.text()).toBe('0')
    })
  })

  // SC-007: Edit button shown (FR-009, FR-010)
  it('renders Edit Profile link with correct href when showEditButton is true', () => {
    const wrapper = mountCard({ showEditButton: true, editUrl: '/profiles/me/edit' })
    const link = wrapper.find('a[href="/profiles/me/edit"]')

    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('Edit Profile')
  })

  // SC-008: Edit button hidden (FR-009)
  it('does not render Edit Profile button when showEditButton is false', () => {
    const wrapper = mountCard({ showEditButton: false })

    expect(wrapper.text()).not.toContain('Edit Profile')
  })

  // SC-009: Membership date formatting (FR-006)
  it('formats membership date as "Member since Mon YYYY"', () => {
    const wrapper1 = mountCard({ memberSince: '2024-01-15T10:30:00Z' })
    expect(wrapper1.text()).toContain('Member since Jan 2024')

    const wrapper2 = mountCard({ memberSince: '2025-12-01T00:00:00Z' })
    expect(wrapper2.text()).toContain('Member since Dec 2025')
  })

  // NFR-003: Metadata icons have aria-hidden
  it('renders metadata icons with aria-hidden="true"', () => {
    const wrapper = mountCard()
    const metadataRow = wrapper.find('[data-testid="metadata-row"]')
    const svgs = metadataRow.findAll('svg')

    expect(svgs.length).toBeGreaterThanOrEqual(3)
    svgs.forEach((svg) => {
      expect(svg.attributes('aria-hidden')).toBe('true')
    })
  })

  // EC-1: Very long name truncation
  it('truncates a very long name with the truncate class', () => {
    const longName =
      'Alexandra Konstantinidou-Papadopoulou von Hohenzollern the Third of the Great Kingdom'
    const wrapper = mountCard({ fullName: longName })

    const nameEl = wrapper.find(`[data-slot="card-title"][title="${longName}"]`)
    expect(nameEl.exists()).toBe(true)
    expect(nameEl.classes()).toContain('truncate')
  })

  // EC-4: showEditButton true but editUrl empty
  it('does not render edit button when showEditButton is true but editUrl is empty', () => {
    const wrapper = mountCard({ showEditButton: true, editUrl: '' })

    expect(wrapper.text()).not.toContain('Edit Profile')
  })

  // EC-6: Very large content counts
  it('displays very large content counts without truncation', () => {
    const wrapper = mountCard({ promptCount: 10000, skillCount: 99999 })

    expect(wrapper.text()).toContain('10000')
    expect(wrapper.text()).toContain('99999')
  })

  // FR-009: Built on shadcn/vue Card
  it('renders within a shadcn/vue Card component', () => {
    const wrapper = mountCard()
    const card = wrapper.find('[data-slot="card"]')

    expect(card.exists()).toBe(true)
  })

  // Name rendered in CardTitle
  it('renders the full name inside a CardTitle', () => {
    const wrapper = mountCard()
    const title = wrapper.find('[data-slot="card-title"]')

    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('Willem Meints')
  })
})
