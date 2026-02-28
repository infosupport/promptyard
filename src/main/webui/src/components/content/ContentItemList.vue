<script setup lang="ts">
import { FileText } from 'lucide-vue-next'
import type { ContentItemSummary } from '@/lib/content-types'
import { Card, CardContent } from '@/components/ui/card'
import ContentItemCard from './ContentItemCard.vue'
import ContentItemListSkeleton from './ContentItemListSkeleton.vue'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

const props = withDefaults(
  defineProps<{
    items: ContentItemSummary[]
    pageIndex: number
    totalPages: number
    loading?: boolean
  }>(),
  {
    loading: false,
  },
)

const emit = defineEmits<{
  'page-change': [pageIndex: number]
}>()

function onPageChange(page: number) {
  const zeroBasedPage = page - 1
  if (zeroBasedPage !== props.pageIndex) {
    emit('page-change', zeroBasedPage)
  }
}
</script>

<template>
  <div>
    <!-- Loading state -->
    <ContentItemListSkeleton v-if="loading" />

    <!-- Empty state -->
    <Card v-else-if="items.length === 0" role="status">
      <CardContent class="flex items-center gap-4 py-6">
        <FileText class="h-10 w-10 text-muted-foreground/50" />
        <div>
          <p class="font-medium">No content items found</p>
          <p class="text-sm text-muted-foreground">Maybe you have something to share?</p>
        </div>
      </CardContent>
    </Card>

    <!-- Content state -->
    <template v-else>
      <div class="space-y-4">
        <ContentItemCard
          v-for="item in items"
          :key="item.url"
          :title="item.title"
          :description="item.description"
          :tags="item.tags"
          :content-type="item.contentType"
          :author-name="item.authorName"
          :url="item.url"
        />
      </div>

      <!-- Pagination -->
      <Pagination
        v-if="totalPages > 1"
        :total="totalPages * 10"
        :items-per-page="10"
        :page="pageIndex + 1"
        :sibling-count="1"
        show-edges
        class="mt-6"
        @update:page="onPageChange"
      >
        <PaginationContent v-slot="{ items: paginationItems }">
          <PaginationPrevious />
          <template v-for="(item, i) in paginationItems" :key="i">
            <PaginationItem
              v-if="item.type === 'page'"
              :value="item.value"
              :is-active="item.value === pageIndex + 1"
            />
            <PaginationEllipsis v-else :index="i" />
          </template>
          <PaginationNext />
        </PaginationContent>
      </Pagination>
    </template>
  </div>
</template>
