import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import MonacoEditor from './MonacoEditor.vue'

const meta = {
  title: 'Content/MonacoEditor',
  component: MonacoEditor,
  tags: ['autodocs'],
  args: {
    'onUpdate:modelValue': fn(),
  },
} satisfies Meta<typeof MonacoEditor>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    modelValue: '',
  },
}

export const WithContent: Story = {
  args: {
    modelValue: `# Code Review Checklist

## Before Submitting

- [ ] Code compiles without warnings
- [ ] All tests pass
- [ ] No hardcoded secrets or credentials

## Review Focus Areas

1. **Readability** - Is the code easy to understand?
2. **Performance** - Are there any obvious bottlenecks?
3. **Security** - Are inputs validated and sanitized?
`,
  },
}

export const Disabled: Story = {
  args: {
    modelValue: `# Read-Only Content

This editor is in read-only mode. You cannot edit this content.
`,
    disabled: true,
  },
}
