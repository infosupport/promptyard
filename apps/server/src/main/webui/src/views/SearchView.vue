<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { ContentItemList } from '@/components/content'
import { useSearch } from '@/composables/useSearch'

const route = useRoute()
const router = useRouter()
const { items, pageIndex, totalPages, loading, error, search } = useSearch()

const searchInput = ref('')

function parsePageParam(value: unknown): number {
  const parsed = parseInt(String(value))
  return isNaN(parsed) || parsed < 1 ? 0 : parsed - 1
}

function performSearch() {
  const query = String(route.query.q ?? '').trim()
  searchInput.value = String(route.query.q ?? '')

  if (!query) return

  const page = parsePageParam(route.query.page)
  search(query, page)
}

watch(
  () => [route.query.q, route.query.page],
  () => performSearch(),
  { immediate: true },
)

function onSubmit() {
  const trimmed = searchInput.value.trim()
  if (!trimmed) return
  router.push({ path: '/search', query: { q: trimmed } })
}

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
    <h1 class="mb-6 text-2xl font-semibold tracking-tight">Search</h1>

    <form class="relative mb-8" @submit.prevent="onSubmit">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        v-model="searchInput"
        type="search"
        placeholder="Search prompts, skills..."
        aria-label="Search content"
        class="pl-10"
      />
    </form>

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
