<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import { RouterLink } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CONTENT_TYPE_CONFIG, type ContentType } from '@/lib/content-types'
import { useTagOverflow } from '@/composables/useTagOverflow'
import { cn } from '@/lib/utils'

const props = defineProps<{
  title: string
  description: string
  tags: string[]
  contentType: ContentType
  authorName: string
  url: string
}>()

const slots = useSlots()

const typeConfig = computed(() => CONTENT_TYPE_CONFIG[props.contentType])

const tagsContainerRef = ref<HTMLElement | null>(null)
const totalTagCount = computed(() => props.tags.length)
const { visibleCount, hiddenCount } = useTagOverflow(tagsContainerRef, totalTagCount)
</script>

<template>
  <Card :class="cn('border-t-2 overflow-hidden', typeConfig.borderColor)">
    <CardHeader>
      <div class="flex items-center gap-2">
        <component
          :is="typeConfig.icon"
          :class="cn('size-4 shrink-0', typeConfig.iconColor)"
          :aria-label="typeConfig.label"
          role="img"
        />
        <CardTitle class="min-w-0 flex-1">
          <RouterLink
            :to="url"
            class="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring line-clamp-1"
          >
            {{ title }}
          </RouterLink>
        </CardTitle>
        <div v-if="slots.actions" class="flex shrink-0 items-center gap-2">
          <slot name="actions" />
        </div>
      </div>
    </CardHeader>

    <CardContent v-if="description" class="space-y-3">
      <p class="text-sm text-muted-foreground line-clamp-3">
        {{ description }}
      </p>
    </CardContent>

    <CardContent v-if="tags.length > 0" class="pt-0">
      <div
        ref="tagsContainerRef"
        class="flex flex-wrap items-center gap-1 overflow-hidden max-h-7"
      >
        <Badge
          v-for="(tag, index) in tags"
          :key="`${tag}-${index}`"
          variant="secondary"
          :class="{ 'invisible absolute': index >= visibleCount && hiddenCount > 0 }"
          class="truncate max-w-32 text-xs"
        >
          {{ tag }}
        </Badge>
        <span
          v-if="hiddenCount > 0"
          data-overflow-indicator
          class="text-xs text-muted-foreground whitespace-nowrap"
        >
          +{{ hiddenCount }} more
        </span>
      </div>
    </CardContent>

    <CardContent class="pt-0">
      <p class="text-xs text-muted-foreground">{{ authorName }}</p>
    </CardContent>

  </Card>
</template>
