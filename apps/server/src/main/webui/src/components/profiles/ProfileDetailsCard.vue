<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatMemberSince } from '@/lib/format'
import { CONTENT_TYPE_CONFIG } from '@/lib/content-types'
import { Briefcase, Building2, CalendarDays, Pencil } from 'lucide-vue-next'

const props = defineProps<{
  fullName: string
  jobTitle?: string
  businessUnit?: string
  memberSince: string
  promptCount: number
  skillCount: number
  agentCount: number
  workflowCount: number
  showEditButton: boolean
  editUrl?: string
}>()

const formattedMemberSince = computed(() => formatMemberSince(props.memberSince))

const stats = computed(() => [
  { label: 'Prompts', count: props.promptCount, colorClass: CONTENT_TYPE_CONFIG.prompt.iconColor },
  { label: 'Skills', count: props.skillCount, colorClass: CONTENT_TYPE_CONFIG.skill.iconColor },
  { label: 'Agents', count: props.agentCount, colorClass: CONTENT_TYPE_CONFIG.agent.iconColor },
  {
    label: 'Workflows',
    count: props.workflowCount,
    colorClass: CONTENT_TYPE_CONFIG.workflow.iconColor,
  },
])

const showEdit = computed(() => props.showEditButton && !!props.editUrl)
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="truncate" :title="fullName">
        {{ fullName }}
      </CardTitle>

      <!-- Metadata row: job title, business unit, member since -->
      <div
        class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground"
        data-testid="metadata-row"
      >
        <span v-if="jobTitle" class="flex items-center gap-1.5 truncate max-w-64">
          <Briefcase aria-hidden="true" class="size-4 shrink-0" />
          <span class="truncate" :title="jobTitle">{{ jobTitle }}</span>
        </span>
        <span v-if="businessUnit" class="flex items-center gap-1.5 truncate max-w-64">
          <Building2 aria-hidden="true" class="size-4 shrink-0" />
          <span class="truncate" :title="businessUnit">{{ businessUnit }}</span>
        </span>
        <span class="flex items-center gap-1.5">
          <CalendarDays aria-hidden="true" class="size-4 shrink-0" />
          {{ formattedMemberSince }}
        </span>
      </div>

      <!-- Right: Edit Button (conditional) -->
      <CardAction v-if="showEdit">
        <Button variant="outline" as-child>
          <RouterLink :to="editUrl!">
            <Pencil class="size-4 mr-2" />
            Edit Profile
          </RouterLink>
        </Button>
      </CardAction>
    </CardHeader>

    <CardContent>
      <!-- Stats row -->
      <div class="flex items-center gap-6" data-testid="stats-row">
        <div v-for="stat in stats" :key="stat.label" class="text-center">
          <p :class="['text-lg font-semibold', stat.colorClass]" data-testid="stat-count">
            {{ stat.count }}
          </p>
          <p class="text-xs text-muted-foreground">{{ stat.label }}</p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
