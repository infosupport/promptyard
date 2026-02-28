import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import CommentsSection from '../CommentsSection.vue'
import type { CommentResponse } from '@/services/comments'

vi.mock('@/services/comments', () => ({
  getComments: vi.fn(),
  createComment: vi.fn(),
}))

import { getComments, createComment } from '@/services/comments'

const mockComments: CommentResponse[] = [
  {
    id: 2,
    text: 'I agree, very useful!',
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    authorFullName: 'John Smith',
  },
  {
    id: 1,
    text: 'Great prompt, very helpful!',
    createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
    authorFullName: 'Jane Doe',
  },
]

function mountComponent() {
  return mount(CommentsSection, {
    props: { slug: 'test-prompt' },
  })
}

describe('CommentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeletons while fetching comments', () => {
    vi.mocked(getComments).mockReturnValue(new Promise(() => {}))

    const wrapper = mountComponent()

    expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('renders comments after successful fetch', async () => {
    vi.mocked(getComments).mockResolvedValue(mockComments)

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('John Smith')
    expect(wrapper.text()).toContain('I agree, very useful!')
    expect(wrapper.text()).toContain('Jane Doe')
    expect(wrapper.text()).toContain('Great prompt, very helpful!')
  })

  it('shows relative timestamps for comments', async () => {
    vi.mocked(getComments).mockResolvedValue(mockComments)

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('hour')
  })

  it('shows empty state when there are no comments', async () => {
    vi.mocked(getComments).mockResolvedValue([])

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('No comments yet')
  })

  it('shows fetch error state with retry button', async () => {
    vi.mocked(getComments).mockRejectedValue(new Error('Network error'))

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to load comments')
    const buttons = wrapper.findAll('button')
    const retryButton = buttons.find((b) => b.text().includes('Retry'))
    expect(retryButton).toBeDefined()
  })

  it('retries fetching comments when retry button is clicked', async () => {
    vi.mocked(getComments)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockComments)

    const wrapper = mountComponent()
    await flushPromises()

    const buttons = wrapper.findAll('button')
    const retryButton = buttons.find((b) => b.text().includes('Retry'))!
    await retryButton.trigger('click')
    await flushPromises()

    expect(getComments).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('John Smith')
  })

  it('submits a new comment and prepends it to the list', async () => {
    vi.mocked(getComments).mockResolvedValue([...mockComments])

    const newComment: CommentResponse = {
      id: 3,
      text: 'Nice work!',
      createdAt: new Date().toISOString(),
      authorFullName: 'Alice Johnson',
    }
    vi.mocked(createComment).mockResolvedValue(newComment)

    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('textarea').setValue('Nice work!')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(createComment).toHaveBeenCalledWith('test-prompt', { text: 'Nice work!' })
    expect(wrapper.text()).toContain('Alice Johnson')
    expect(wrapper.text()).toContain('Nice work!')
  })

  it('shows submit error and preserves form text on failure', async () => {
    vi.mocked(getComments).mockResolvedValue([])
    vi.mocked(createComment).mockRejectedValue(new Error('Server error'))

    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('textarea').setValue('My comment')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Failed to post comment')
  })

  it('fetches comments using the slug prop', async () => {
    vi.mocked(getComments).mockResolvedValue([])

    mountComponent()
    await flushPromises()

    expect(getComments).toHaveBeenCalledWith('test-prompt')
  })

  it('renders the comment form with textarea and submit button', async () => {
    vi.mocked(getComments).mockResolvedValue([])

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toContain('Post comment')
  })

  it('renders the card with "Comments" title', async () => {
    vi.mocked(getComments).mockResolvedValue([])

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.find('[data-slot="card-title"]').text()).toBe('Comments')
  })
})
