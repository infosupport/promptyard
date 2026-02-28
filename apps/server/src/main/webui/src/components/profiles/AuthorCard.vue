<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/format'

const props = defineProps<{
  fullName: string
  jobTitle?: string
  promptCount: number
  skillCount: number
  agentCount: number
  workflowCount: number
  profileUrl: string
}>()

const initials = computed(() => getInitials(props.fullName))

const stats = computed(() => [
  { label: 'Prompts', count: props.promptCount },
  { label: 'Skills', count: props.skillCount },
  { label: 'Agents', count: props.agentCount },
  { label: 'Workflows', count: props.workflowCount },
])
</script>

<template>
  <Card class="w-72">
    <CardHeader class="items-center justify-items-center text-center">
      <Avatar
        :class="'size-16 rounded-lg bg-gradient-to-br from-primary to-primary/60'"
        :aria-label="fullName"
      >
        <AvatarFallback
          class="rounded-lg bg-transparent text-xl font-semibold text-primary-foreground"
        >
          {{ initials }}
        </AvatarFallback>
      </Avatar>
      <div class="mt-2 space-y-0.5 min-w-0 w-full">
        <p class="text-sm font-semibold truncate max-w-full" :title="fullName">
          {{ fullName }}
        </p>
        <p
          v-if="jobTitle"
          class="text-xs text-muted-foreground truncate max-w-full"
          :title="jobTitle"
        >
          {{ jobTitle }}
        </p>
      </div>
    </CardHeader>

    <CardContent class="pt-0">
      <Separator class="mb-4" />
      <div class="grid grid-cols-4 gap-2 text-center">
        <div v-for="stat in stats" :key="stat.label">
          <p class="text-lg font-semibold">{{ stat.count }}</p>
          <p class="text-xs text-muted-foreground">{{ stat.label }}</p>
        </div>
      </div>
      <Separator class="my-4" />
      <Button variant="outline" class="w-full" as-child>
        <RouterLink :to="profileUrl">View Profile</RouterLink>
      </Button>
    </CardContent>
  </Card>
</template>
