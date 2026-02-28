<script setup lang="ts">
import { RouterLink } from 'vue-router'

export interface BreadcrumbSegment {
  label: string
  to?: string
}

defineProps<{
  segments: BreadcrumbSegment[]
}>()
</script>

<template>
  <nav aria-label="Breadcrumb" class="mb-6">
    <ol class="flex items-center gap-1.5 text-sm text-muted-foreground">
      <template v-for="(segment, index) in segments" :key="index">
        <li v-if="index > 0" aria-hidden="true">/</li>
        <li
          :class="{
            'text-foreground font-medium': index === segments.length - 1,
          }"
        >
          <RouterLink
            v-if="segment.to && index < segments.length - 1"
            :to="segment.to"
            class="hover:text-foreground transition-colors"
          >
            {{ segment.label }}
          </RouterLink>
          <span v-else>{{ segment.label }}</span>
        </li>
      </template>
    </ol>
  </nav>
</template>
