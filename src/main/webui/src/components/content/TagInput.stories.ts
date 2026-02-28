import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import TagInput from './TagInput.vue'

const meta = {
  title: 'Content/TagInput',
  component: TagInput,
  tags: ['autodocs'],
} satisfies Meta<typeof TagInput>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  render: () => ({
    components: { TagInput },
    setup() {
      const tags = ref<string[]>([])
      return { tags }
    },
    template: '<TagInput v-model="tags" />',
  }),
}

export const WithTags: Story = {
  render: () => ({
    components: { TagInput },
    setup() {
      const tags = ref(['kotlin', 'code-review', 'testing', 'best-practices'])
      return { tags }
    },
    template: '<TagInput v-model="tags" />',
  }),
}

export const ManyTags: Story = {
  render: () => ({
    components: { TagInput },
    setup() {
      const tags = ref([
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
        'docker',
        'kubernetes',
      ])
      return { tags }
    },
    template: '<TagInput v-model="tags" />',
  }),
}

export const Disabled: Story = {
  render: () => ({
    components: { TagInput },
    setup() {
      const tags = ref(['kotlin', 'code-review', 'testing'])
      return { tags }
    },
    template: '<TagInput v-model="tags" disabled />',
  }),
}
