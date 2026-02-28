<script setup lang="ts">
import { ChevronDown, FileText, Sparkles, Bot, Workflow } from 'lucide-vue-next'
import { Button, type ButtonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

withDefaults(
  defineProps<{
    variant?: ButtonVariants['variant']
    size?: ButtonVariants['size']
  }>(),
  {
    variant: 'outline',
    size: 'sm',
  },
)
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button :variant="variant" :size="size">
        Create
        <ChevronDown class="ml-1 h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem as-child>
        <RouterLink to="/content/prompts/new">
          <FileText class="mr-2 h-4 w-4" />
          Prompt
        </RouterLink>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Sparkles class="mr-2 h-4 w-4" />
        Skill
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Bot class="mr-2 h-4 w-4" />
        Agent
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Workflow class="mr-2 h-4 w-4" />
        Workflow
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
