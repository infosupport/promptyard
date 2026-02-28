import { Bot, MessageSquareText, Sparkles, Workflow } from 'lucide-vue-next'
import type { Component } from 'vue'

export type ContentType = 'prompt' | 'skill' | 'agent' | 'workflow'

export const CONTENT_TYPES: ContentType[] = ['prompt', 'skill', 'agent', 'workflow']

export interface ContentTypeConfig {
  label: string
  icon: Component
  borderColor: string
  iconColor: string
}

export const CONTENT_TYPE_CONFIG: Record<ContentType, ContentTypeConfig> = {
  prompt: {
    label: 'Prompt',
    icon: MessageSquareText,
    borderColor: 'border-t-blue-500',
    iconColor: 'text-blue-500',
  },
  skill: {
    label: 'Skill',
    icon: Sparkles,
    borderColor: 'border-t-amber-500',
    iconColor: 'text-amber-500',
  },
  agent: {
    label: 'Agent',
    icon: Bot,
    borderColor: 'border-t-violet-500',
    iconColor: 'text-violet-500',
  },
  workflow: {
    label: 'Workflow',
    icon: Workflow,
    borderColor: 'border-t-emerald-500',
    iconColor: 'text-emerald-500',
  },
}

export interface ContentItemSummary {
  title: string
  description: string
  tags: string[]
  contentType: ContentType
  authorName: string
  url: string
}
