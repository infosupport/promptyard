import type { Meta, StoryObj } from '@storybook/vue3-vite'
import CommentsSection from './CommentsSection.vue'

const meta = {
  title: 'Content/CommentsSection',
  component: CommentsSection,
  tags: ['autodocs'],
  args: {
    slug: 'example-prompt',
  },
} satisfies Meta<typeof CommentsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    slug: 'example-prompt',
  },
}
