<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ContentItemList } from '@/components/content'
import { AppBreadcrumb } from '@/components/navigation'
import { useSearch } from '@/composables/useSearch'

const route = useRoute()
const router = useRouter()
const { items, pageIndex, totalPages, totalItems, loading, error, search } = useSearch()

function parsePageParam(value: unknown): number {
  const parsed = parseInt(String(value))
  return isNaN(parsed) || parsed < 1 ? 0 : parsed - 1
}

function performSearch() {
  const query = String(route.query.q ?? '').trim()

  if (!query) return

  const page = parsePageParam(route.query.page)
  search(query, page)
}

watch(
  () => [route.query.q, route.query.page],
  () => performSearch(),
  { immediate: true },
)

function onPageChange(newPageIndex: number) {
  const query = String(route.query.q ?? '').trim()
  if (!query) return

  if (newPageIndex === 0) {
    router.push({ path: '/search', query: { q: query } })
  } else {
    router.push({ path: '/search', query: { q: query, page: String(newPageIndex + 1) } })
  }
}

const hasQuery = ref(false)
watch(
  () => route.query.q,
  (q) => {
    hasQuery.value = !!String(q ?? '').trim()
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <AppBreadcrumb
      :segments="[{ label: 'Promptyard', to: '/' }, { label: 'Search results' }]"
    />

    <h1 class="mb-6 text-2xl font-semibold tracking-tight">
      Search results<template v-if="hasQuery && !loading && !error"> ({{ totalItems }} items found)</template>
    </h1>

    <div v-if="!hasQuery" class="py-12 text-center text-muted-foreground">
      Enter a search term to find prompts, skills, and more.
    </div>

    <div
      v-else-if="error"
      class="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive"
    >
      Search failed. Please try again later.
    </div>

    <div
      v-else-if="!loading && hasQuery && items.length === 0"
      class="py-12 text-center text-muted-foreground"
    >
      No results found for "{{ String(route.query.q ?? '') }}".
    </div>

    <ContentItemList
      v-else
      :items="items"
      :page-index="pageIndex"
      :total-pages="totalPages"
      :loading="loading"
      @page-change="onPageChange"
    />
  </div>
</template>
