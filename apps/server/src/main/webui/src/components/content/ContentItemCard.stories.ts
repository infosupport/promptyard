import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Button } from '@/components/ui/button'
import ContentItemCard from './ContentItemCard.vue'

const meta = {
  title: 'Content/ContentItemCard',
  component: ContentItemCard,
  tags: ['autodocs'],
  argTypes: {
    contentType: {
      control: 'select',
      options: ['prompt', 'skill', 'agent', 'workflow'],
    },
  },
} satisfies Meta<typeof ContentItemCard>

export default meta
type Story = StoryObj<typeof meta>

export const Prompt: Story = {
  args: {
    title: 'Generate a product description',
    description:
      'A prompt that generates compelling product descriptions for e-commerce listings based on product features and target audience.',
    tags: ['copywriting', 'e-commerce', 'marketing'],
    contentType: 'prompt',
    authorName: 'Jane Doe',
    url: '/content/generate-a-product-description',
  },
}

export const Skill: Story = {
  args: {
    title: 'Summarize meeting notes',
    description:
      'Extracts key decisions, action items, and follow-ups from unstructured meeting transcripts.',
    tags: ['summarization', 'productivity'],
    contentType: 'skill',
    authorName: 'John Smith',
    url: '/content/summarize-meeting-notes',
  },
}

export const Agent: Story = {
  args: {
    title: 'Customer support agent',
    description:
      'An autonomous agent that handles tier-1 customer support inquiries, escalating complex issues to human operators.',
    tags: ['support', 'automation', 'customer-service'],
    contentType: 'agent',
    authorName: 'Alice Johnson',
    url: '/content/customer-support-agent',
  },
}

export const Workflow: Story = {
  args: {
    title: 'Content review pipeline',
    description:
      'A multi-step workflow that drafts, reviews, and publishes blog content with human-in-the-loop approval.',
    tags: ['content', 'review', 'publishing'],
    contentType: 'workflow',
    authorName: 'Bob Williams',
    url: '/content/content-review-pipeline',
  },
}

export const LongTitle: Story = {
  args: {
    title:
      'A very long title that should demonstrate how the card handles text overflow with the line-clamp behavior applied to the title element',
    description: 'This story tests how the card renders with a long title.',
    tags: ['edge-case'],
    contentType: 'prompt',
    authorName: 'Test User',
    url: '/content/long-title',
  },
}

export const ManyTags: Story = {
  args: {
    title: 'Prompt with many tags',
    description: 'This story tests the tag overflow indicator.',
    tags: [
      'javascript',
      'typescript',
      'vue',
      'react',
      'angular',
      'svelte',
      'node',
      'python',
      'rust',
      'go',
    ],
    contentType: 'prompt',
    authorName: 'Test User',
    url: '/content/many-tags',
  },
}

export const NoTags: Story = {
  args: {
    title: 'Prompt without tags',
    description: 'A prompt that has no tags assigned to it.',
    tags: [],
    contentType: 'prompt',
    authorName: 'Test User',
    url: '/content/no-tags',
  },
}

export const NoDescription: Story = {
  args: {
    title: 'Prompt without description',
    description: '',
    tags: ['minimal'],
    contentType: 'skill',
    authorName: 'Test User',
    url: '/content/no-description',
  },
}

export const WithActions: Story = {
  args: {
    title: 'Generate a product description',
    description:
      'A prompt that generates compelling product descriptions for e-commerce listings based on product features and target audience.',
    tags: ['copywriting', 'e-commerce'],
    contentType: 'prompt',
    authorName: 'Jane Doe',
    url: '/content/generate-a-product-description',
  },
  render: (args) => ({
    components: { ContentItemCard, Button },
    setup: () => ({ args }),
    template: `
      <ContentItemCard v-bind="args">
        <template #actions>
          <Button variant="outline" size="sm">Edit</Button>
          <Button variant="outline" size="sm" class="text-destructive">Delete</Button>
        </template>
      </ContentItemCard>
    `,
  }),
}
