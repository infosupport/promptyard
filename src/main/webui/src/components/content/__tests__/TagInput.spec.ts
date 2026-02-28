import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TagInput from '../TagInput.vue'

function mountTagInput(propsOverride: Partial<{ modelValue: string[]; placeholder: string; disabled: boolean }> = {}) {
  return mount(TagInput, {
    props: {
      modelValue: [],
      ...propsOverride,
    },
  })
}

describe('TagInput', () => {
  it('renders chips for each tag', () => {
    const wrapper = mountTagInput({ modelValue: ['a', 'b', 'c'] })
    const badges = wrapper.findAll('[data-slot="badge"]')

    expect(badges.length).toBe(3)
    expect(badges[0]!.text()).toContain('a')
    expect(badges[1]!.text()).toContain('b')
    expect(badges[2]!.text()).toContain('c')
  })

  it('adds a tag on Enter key', async () => {
    const wrapper = mountTagInput()
    const input = wrapper.find('input')

    await input.setValue('kotlin')
    await input.trigger('keydown', { key: 'Enter' })

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([['kotlin']])
  })

  it('adds a tag on comma key', async () => {
    const wrapper = mountTagInput()
    const input = wrapper.find('input')

    await input.setValue('vue')
    await input.trigger('keydown', { key: ',' })

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([['vue']])
  })

  it('trims whitespace from tags', async () => {
    const wrapper = mountTagInput()
    const input = wrapper.find('input')

    await input.setValue('  kotlin  ')
    await input.trigger('keydown', { key: 'Enter' })

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([['kotlin']])
  })

  it('converts tags to lowercase', async () => {
    const wrapper = mountTagInput()
    const input = wrapper.find('input')

    await input.setValue('Kotlin')
    await input.trigger('keydown', { key: 'Enter' })

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([['kotlin']])
  })

  it('prevents duplicate tags (case-insensitive)', async () => {
    const wrapper = mountTagInput({ modelValue: ['kotlin'] })
    const input = wrapper.find('input')

    await input.setValue('Kotlin')
    await input.trigger('keydown', { key: 'Enter' })

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeUndefined()
  })

  it('does nothing on Enter with empty input', async () => {
    const wrapper = mountTagInput()
    const input = wrapper.find('input')

    await input.setValue('')
    await input.trigger('keydown', { key: 'Enter' })

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeUndefined()
  })

  it('removes a tag when clicking the remove button', async () => {
    const wrapper = mountTagInput({ modelValue: ['kotlin', 'review'] })
    const removeButtons = wrapper.findAll('button[aria-label^="Remove tag"]')

    expect(removeButtons.length).toBe(2)

    await removeButtons[0]!.trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([['review']])
  })

  it('removes the last tag on Backspace when input is empty', async () => {
    const wrapper = mountTagInput({ modelValue: ['kotlin', 'review'] })
    const input = wrapper.find('input')

    await input.setValue('')
    await input.trigger('keydown', { key: 'Backspace' })

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([['kotlin']])
  })

  it('does not remove tag on Backspace when input has text', async () => {
    const wrapper = mountTagInput({ modelValue: ['kotlin'] })
    const input = wrapper.find('input')

    await input.setValue('vu')
    await input.trigger('keydown', { key: 'Backspace' })

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeUndefined()
  })

  it('clears the input after adding a tag', async () => {
    const wrapper = mountTagInput()
    const input = wrapper.find('input')

    await input.setValue('kotlin')
    await input.trigger('keydown', { key: 'Enter' })

    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('shows placeholder when no tags are present', () => {
    const wrapper = mountTagInput({ placeholder: 'Type a tag' })
    const input = wrapper.find('input')

    expect(input.attributes('placeholder')).toBe('Type a tag')
  })

  it('hides placeholder when tags are present', () => {
    const wrapper = mountTagInput({ modelValue: ['kotlin'] })
    const input = wrapper.find('input')

    expect(input.attributes('placeholder')).toBe('')
  })

  it('disables input and remove buttons when disabled', () => {
    const wrapper = mountTagInput({ modelValue: ['kotlin'], disabled: true })
    const input = wrapper.find('input')
    const removeButton = wrapper.find('button[aria-label^="Remove tag"]')

    expect(input.attributes('disabled')).toBeDefined()
    expect(removeButton.attributes('disabled')).toBeDefined()
  })

  it('has accessible role and aria-label on the container', () => {
    const wrapper = mountTagInput()
    const container = wrapper.find('[role="group"]')

    expect(container.exists()).toBe(true)
    expect(container.attributes('aria-label')).toBe('Tags')
  })

  it('has aria-label on the input matching placeholder', () => {
    const wrapper = mountTagInput({ placeholder: 'Add a tag and press Enter' })
    const input = wrapper.find('input')

    expect(input.attributes('aria-label')).toBe('Add a tag and press Enter')
  })

  it('has accessible aria-label on remove buttons', () => {
    const wrapper = mountTagInput({ modelValue: ['kotlin'] })
    const removeButton = wrapper.find('button[aria-label="Remove tag kotlin"]')

    expect(removeButton.exists()).toBe(true)
  })

  it('adds pending tag on blur', async () => {
    const wrapper = mountTagInput()
    const input = wrapper.find('input')

    await input.setValue('kotlin')
    await input.trigger('blur')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([['kotlin']])
  })

  it('does nothing on blur with empty input', async () => {
    const wrapper = mountTagInput()
    const input = wrapper.find('input')

    await input.setValue('')
    await input.trigger('blur')

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeUndefined()
  })
})
