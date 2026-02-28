import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HomeHeroSection from './HomeHeroSection.vue'

const meta = {
  title: 'Home/HomeHeroSection',
  component: HomeHeroSection,
  tags: ['autodocs'],
} satisfies Meta<typeof HomeHeroSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
