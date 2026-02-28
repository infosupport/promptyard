import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { fn } from 'storybook/test'
import type { ContentItemSummary, ContentType } from '@/lib/content-types'
import ContentItemList from './ContentItemList.vue'

function generateItems(
  count: number,
  contentType: ContentType = 'prompt',
): ContentItemSummary[] {
  const titles: Record<ContentType, string[]> = {
    prompt: [
      'Generate a product description',
      'Write a blog post outline',
      'Summarize customer feedback',
      'Draft an email response',
      'Create a code review checklist',
    ],
    skill: [
      'Summarize meeting notes',
      'Extract action items',
      'Translate technical jargon',
      'Classify support tickets',
      'Parse invoice data',
    ],
    agent: [
      'Customer support agent',
      'Code review assistant',
      'Research analyst',
      'Data entry operator',
      'Scheduling coordinator',
    ],
    workflow: [
      'Content review pipeline',
      'Bug triage workflow',
      'Onboarding checklist',
      'Release management flow',
      'Incident response plan',
    ],
  }

  const authors = ['Jane Doe', 'John Smith', 'Alice Johnson', 'Bob Williams', 'Carol Davis']

  return Array.from({ length: count }, (_, i) => ({
    title: titles[contentType][i % titles[contentType].length],
    description: `A ${contentType} that helps teams work more effectively by automating common tasks and providing structured guidance.`,
    tags: ['productivity', contentType, `tag-${i + 1}`],
    contentType,
    authorName: authors[i % authors.length],
    url: `/content/${contentType}-item-${i + 1}`,
  }))
}

const meta = {
  title: 'Content/ContentItemList',
  component: ContentItemList,
  tags: ['autodocs'],
  args: {
    'onPage-change': fn(),
  },
} satisfies Meta<typeof ContentItemList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    items: generateItems(5),
    pageIndex: 0,
    totalPages: 3,
  },
}

export const SecondPage: Story = {
  args: {
    items: generateItems(5),
    pageIndex: 1,
    totalPages: 3,
  },
}

export const SinglePage: Story = {
  args: {
    items: generateItems(3),
    pageIndex: 0,
    totalPages: 1,
  },
}

export const Empty: Story = {
  args: {
    items: [],
    pageIndex: 0,
    totalPages: 0,
  },
}

export const Loading: Story = {
  args: {
    items: [],
    pageIndex: 0,
    totalPages: 0,
    loading: true,
  },
}

export const ManyPages: Story = {
  args: {
    items: generateItems(5),
    pageIndex: 0,
    totalPages: 20,
  },
}

export const LastPage: Story = {
  args: {
    items: generateItems(2),
    pageIndex: 19,
    totalPages: 20,
  },
}

export const MixedContentTypes: Story = {
  args: {
    items: [
      ...generateItems(1, 'prompt'),
      ...generateItems(1, 'skill'),
      ...generateItems(1, 'agent'),
      ...generateItems(1, 'workflow'),
    ],
    pageIndex: 0,
    totalPages: 1,
  },
}
