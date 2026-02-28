<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAllContent } from '@/composables/useAllContent'
import { HomeHeroSection } from '@/components/home'
import { ContentItemList } from '@/components/content'

const route = useRoute()
const router = useRouter()

const { items, pageIndex, totalPages, loading, error, fetchPage } = useAllContent()

const parsed = parseInt(String(route.query.page))
const initialPageIndex = isNaN(parsed) || parsed < 1 ? 0 : parsed - 1
fetchPage(initialPageIndex)

function onPageChange(newPageIndex: number) {
  fetchPage(newPageIndex)

  if (newPageIndex === 0) {
    router.replace({ query: {} })
  } else {
    router.replace({ query: { page: String(newPageIndex + 1) } })
  }
}
</script>

<template>
  <div>
    <HomeHeroSection />

    <h2 class="mt-8 mb-2 text-xl font-semibold tracking-tight">Recently shared</h2>

    <div
      v-if="error"
      class="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive"
    >
      Failed to load content. Please try again later.
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
