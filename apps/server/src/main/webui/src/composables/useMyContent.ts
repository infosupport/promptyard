import { ref, computed, onMounted } from 'vue'
import { getMyContent, type MyContentPageResponse } from '@/services/profiles'
import type { ContentItemSummary, ContentType } from '@/lib/content-types'

export function useMyContent() {
  const data = ref<MyContentPageResponse | null>(null)
  const loading = ref(true)
  const error = ref(false)

  const items = computed<ContentItemSummary[]>(() => {
    if (!data.value) return []
    return data.value.items.map((item) => ({
      title: item.title,
      description: item.description,
      tags: item.tags,
      contentType: item.contentType as ContentType,
      authorName: item.authorName,
      url: `/content/${item.contentType}s/${item.slug}`,
    }))
  })

  const pageIndex = computed(() => data.value?.pageIndex ?? 0)
  const totalPages = computed(() => data.value?.totalPages ?? 0)

  async function fetchPage(page: number = 0) {
    loading.value = true
    error.value = false

    try {
      data.value = await getMyContent(page)
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchPage()
  })

  return { items, pageIndex, totalPages, loading, error, fetchPage }
}
