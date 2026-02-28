import { describe, it, expect } from 'vitest'
import { CONTENT_TYPE_CONFIG, CONTENT_TYPES } from '../content-types'

describe('content-types', () => {
  it('defines config for all four content types', () => {
    expect(CONTENT_TYPES).toEqual(['prompt', 'skill', 'agent', 'workflow'])
    for (const type of CONTENT_TYPES) {
      const config = CONTENT_TYPE_CONFIG[type]
      expect(config.label).toBeTruthy()
      expect(config.icon).toBeTruthy()
      expect(config.borderColor).toMatch(/^border-t-/)
      expect(config.iconColor).toMatch(/^text-/)
    }
  })

  it('assigns unique colors to each type', () => {
    const colors = CONTENT_TYPES.map((t) => CONTENT_TYPE_CONFIG[t].borderColor)
    expect(new Set(colors).size).toBe(4)
  })

  it('assigns unique icons to each type', () => {
    const icons = CONTENT_TYPES.map((t) => CONTENT_TYPE_CONFIG[t].icon)
    expect(new Set(icons).size).toBe(4)
  })

  it('has matching label casing for each type', () => {
    expect(CONTENT_TYPE_CONFIG.prompt.label).toBe('Prompt')
    expect(CONTENT_TYPE_CONFIG.skill.label).toBe('Skill')
    expect(CONTENT_TYPE_CONFIG.agent.label).toBe('Agent')
    expect(CONTENT_TYPE_CONFIG.workflow.label).toBe('Workflow')
  })
})
