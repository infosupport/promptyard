import { ref, computed } from 'vue'
import { getAllContent, type ContentPageResponse } from '@/services/content'
import type { ContentItemSummary, ContentType } from '@/lib/content-types'

export function useAllContent() {
  const data = ref<ContentPageResponse | null>(null)
  const loading = ref(false)
  const error = ref(false)

  const items = computed<ContentItemSummary[]>(() => {
    if (!data.value) return []
    return data.value.items.map((item) => ({
      title: item.title,
      description: item.description,
      tags: item.tags,
      contentType: item.contentType as ContentType,
      authorName: item.author.fullName,
      url: `/content/${item.contentType}s/${item.slug}`,
    }))
  })

  const pageIndex = computed(() => data.value?.pageIndex ?? 0)
  const totalPages = computed(() => data.value?.totalPages ?? 0)

  async function fetchPage(page: number = 0) {
    loading.value = true
    error.value = false

    try {
      data.value = await getAllContent(page)
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  return { items, pageIndex, totalPages, loading, error, fetchPage }
}
