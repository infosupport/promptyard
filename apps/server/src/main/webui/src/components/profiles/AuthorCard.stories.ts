import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AuthorCard from './AuthorCard.vue'

const meta = {
  title: 'Profiles/AuthorCard',
  component: AuthorCard,
  tags: ['autodocs'],
  argTypes: {
    promptCount: { control: { type: 'number', min: 0 } },
    skillCount: { control: { type: 'number', min: 0 } },
    agentCount: { control: { type: 'number', min: 0 } },
    workflowCount: { control: { type: 'number', min: 0 } },
  },
} satisfies Meta<typeof AuthorCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    fullName: 'Michael Sander',
    jobTitle: 'Senior Software Engineer',
    promptCount: 24,
    skillCount: 8,
    agentCount: 3,
    workflowCount: 2,
    profileUrl: '/profiles/michael-sander',
  },
}

export const NoJobTitle: Story = {
  args: {
    fullName: 'Michael Sander',
    promptCount: 24,
    skillCount: 8,
    agentCount: 3,
    workflowCount: 2,
    profileUrl: '/profiles/michael-sander',
  },
}

export const AllZeroCounts: Story = {
  args: {
    fullName: 'New User',
    jobTitle: 'Intern',
    promptCount: 0,
    skillCount: 0,
    agentCount: 0,
    workflowCount: 0,
    profileUrl: '/profiles/new-user',
  },
}

export const SingleWordName: Story = {
  args: {
    fullName: 'Madonna',
    jobTitle: 'Artist',
    promptCount: 5,
    skillCount: 1,
    agentCount: 0,
    workflowCount: 0,
    profileUrl: '/profiles/madonna',
  },
}

export const MultiPartName: Story = {
  args: {
    fullName: 'Jan van der Berg',
    jobTitle: 'Lead Developer',
    promptCount: 42,
    skillCount: 15,
    agentCount: 7,
    workflowCount: 4,
    profileUrl: '/profiles/jan-van-der-berg',
  },
}

export const LongName: Story = {
  args: {
    fullName: 'Alexandra Konstantinidou-Papadopoulou von Hohenzollern',
    jobTitle: 'Distinguished Principal Staff Software Architect and Technical Fellow',
    promptCount: 100,
    skillCount: 50,
    agentCount: 25,
    workflowCount: 10,
    profileUrl: '/profiles/alexandra-konstantinidou',
  },
}
