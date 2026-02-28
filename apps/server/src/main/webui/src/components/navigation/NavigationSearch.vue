<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'

const router = useRouter()
const query = ref('')

function onSubmit() {
  const trimmed = query.value.trim()
  if (!trimmed) return
  router.push({ path: '/search', query: { q: trimmed } })
}
</script>

<template>
  <form class="relative flex-1" @submit.prevent="onSubmit">
    <Search class="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      v-model="query"
      type="search"
      placeholder="Search prompts, skills..."
      class="h-9 pl-9"
    />
  </form>
</template>
