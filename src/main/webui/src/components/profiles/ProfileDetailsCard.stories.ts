import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ProfileDetailsCard from './ProfileDetailsCard.vue'

const meta = {
  title: 'Profiles/ProfileDetailsCard',
  component: ProfileDetailsCard,
  tags: ['autodocs'],
  argTypes: {
    promptCount: { control: { type: 'number', min: 0 } },
    skillCount: { control: { type: 'number', min: 0 } },
    agentCount: { control: { type: 'number', min: 0 } },
    workflowCount: { control: { type: 'number', min: 0 } },
    showEditButton: { control: 'boolean' },
  },
} satisfies Meta<typeof ProfileDetailsCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    fullName: 'Willem Meints',
    jobTitle: 'Machine Learning Engineer',
    businessUnit: 'Unit AI & Data',
    memberSince: '2024-01-15T10:30:00Z',
    promptCount: 12,
    skillCount: 5,
    agentCount: 3,
    workflowCount: 2,
    showEditButton: true,
    editUrl: '/profiles/edit',
  },
}

export const WithoutEditButton: Story = {
  args: {
    fullName: 'Willem Meints',
    jobTitle: 'Machine Learning Engineer',
    businessUnit: 'Unit AI & Data',
    memberSince: '2024-01-15T10:30:00Z',
    promptCount: 12,
    skillCount: 5,
    agentCount: 3,
    workflowCount: 2,
    showEditButton: false,
  },
}

export const NoJobTitle: Story = {
  args: {
    fullName: 'Willem Meints',
    businessUnit: 'Unit AI & Data',
    memberSince: '2024-01-15T10:30:00Z',
    promptCount: 12,
    skillCount: 5,
    agentCount: 3,
    workflowCount: 2,
    showEditButton: true,
    editUrl: '/profiles/edit',
  },
}

export const NoBusinessUnit: Story = {
  args: {
    fullName: 'Willem Meints',
    jobTitle: 'Machine Learning Engineer',
    memberSince: '2024-01-15T10:30:00Z',
    promptCount: 12,
    skillCount: 5,
    agentCount: 3,
    workflowCount: 2,
    showEditButton: true,
    editUrl: '/profiles/edit',
  },
}

export const MinimalMetadata: Story = {
  args: {
    fullName: 'Willem Meints',
    memberSince: '2024-01-15T10:30:00Z',
    promptCount: 12,
    skillCount: 5,
    agentCount: 3,
    workflowCount: 2,
    showEditButton: true,
    editUrl: '/profiles/edit',
  },
}

export const AllZeroCounts: Story = {
  args: {
    fullName: 'New User',
    jobTitle: 'Intern',
    businessUnit: 'Onboarding',
    memberSince: '2026-02-26T09:00:00Z',
    promptCount: 0,
    skillCount: 0,
    agentCount: 0,
    workflowCount: 0,
    showEditButton: true,
    editUrl: '/profiles/edit',
  },
}

export const HighCounts: Story = {
  args: {
    fullName: 'Power User',
    jobTitle: 'Principal Engineer',
    businessUnit: 'Platform Engineering',
    memberSince: '2020-03-01T08:00:00Z',
    promptCount: 10432,
    skillCount: 5891,
    agentCount: 2310,
    workflowCount: 789,
    showEditButton: true,
    editUrl: '/profiles/edit',
  },
}

export const LongName: Story = {
  args: {
    fullName:
      'Alexandra Konstantinidou-Papadopoulou von Hohenzollern the Third of the Greater Metropolitan Area',
    jobTitle: 'Distinguished Principal Staff Software Architect and Technical Fellow',
    businessUnit: 'Global Center of Excellence for Advanced Digital Transformation Initiatives',
    memberSince: '2022-06-15T14:00:00Z',
    promptCount: 42,
    skillCount: 18,
    agentCount: 7,
    workflowCount: 3,
    showEditButton: true,
    editUrl: '/profiles/edit',
  },
}

export const SingleWordName: Story = {
  args: {
    fullName: 'Madonna',
    jobTitle: 'Artist',
    businessUnit: 'Creative',
    memberSince: '2023-11-01T12:00:00Z',
    promptCount: 5,
    skillCount: 1,
    agentCount: 0,
    workflowCount: 0,
    showEditButton: false,
  },
}
