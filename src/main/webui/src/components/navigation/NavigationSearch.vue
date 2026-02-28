<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
</script>

<template>
  <div class="relative flex-1">
    <Search class="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input type="search" placeholder="Search prompts, skills..." class="h-9 pl-9" />
  </div>
</template>
