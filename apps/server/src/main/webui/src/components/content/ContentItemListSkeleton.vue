<script setup lang="ts">
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="space-y-4">
    <Card v-for="n in 3" :key="n" class="border-t-2">
      <CardHeader>
        <div class="flex items-center gap-2">
          <Skeleton class="size-4 rounded-full" />
          <Skeleton class="h-5 w-3/5" />
        </div>
      </CardHeader>

      <CardContent class="space-y-2">
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-3/4" />
      </CardContent>

      <CardContent class="flex gap-1 pt-0">
        <Skeleton class="h-5 w-16 rounded-full" />
        <Skeleton class="h-5 w-20 rounded-full" />
        <Skeleton class="h-5 w-14 rounded-full" />
      </CardContent>

      <CardContent class="pt-0">
        <Skeleton class="h-3 w-24" />
      </CardContent>
    </Card>
  </div>
</template>
