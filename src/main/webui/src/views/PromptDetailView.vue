<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getPromptBySlug, type PromptDetailResponse } from '@/services/prompts'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MonacoEditor } from '@/components/content'
import { AuthorCard } from '@/components/profiles'
import { AppBreadcrumb } from '@/components/navigation'
import { Copy, Check, Pencil } from 'lucide-vue-next'

const route = useRoute()
const slug = route.params.slug as string

const prompt = ref<PromptDetailResponse | null>(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const copied = ref(false)
const copyError = ref('')

async function fetchData() {
  loading.value = true
  error.value = ''
  notFound.value = false

  try {
    prompt.value = await getPromptBySlug(slug)
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      notFound.value = true
    } else {
      error.value = 'Something went wrong while loading the prompt. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

async function copyContent() {
  if (!prompt.value) return
  copyError.value = ''
  try {
    await navigator.clipboard.writeText(prompt.value.content)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    copyError.value = 'Failed to copy to clipboard.'
    setTimeout(() => {
      copyError.value = ''
    }, 3000)
  }
}

onMounted(fetchData)

defineExpose({ prompt, loading, error, notFound, copied, copyError, fetchData, copyContent })
</script>

<template>
  <div>
    <!-- Loading state (FR-010) -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <p class="text-muted-foreground">Loading...</p>
    </div>

    <!-- Not found state (FR-009) -->
    <div v-else-if="notFound" class="flex flex-col items-center justify-center py-12 space-y-4">
      <p class="text-lg font-medium">Prompt not found</p>
      <p class="text-muted-foreground">
        The prompt you're looking for doesn't exist or has been removed.
      </p>
      <Button variant="outline" as-child>
        <RouterLink to="/">Back to home</RouterLink>
      </Button>
    </div>

    <!-- Error state (EC-5) -->
    <div v-else-if="error && !prompt" class="flex flex-col items-center justify-center py-12 space-y-4">
      <p class="text-sm text-destructive" role="alert">{{ error }}</p>
      <Button variant="outline" @click="fetchData">Retry</Button>
    </div>

    <!-- Main content -->
    <template v-else-if="prompt">
      <!-- Breadcrumb (FR-008) -->
      <AppBreadcrumb
        :segments="[
          { label: 'Promptyard', to: '/' },
          { label: 'Prompts' },
          { label: prompt.title },
        ]"
      />

      <div class="grid grid-cols-[1fr_auto] gap-6">
        <!-- Main column -->
        <div class="space-y-6 min-w-0">
          <!-- Metadata card (FR-003) -->
          <Card>
            <CardHeader>
              <CardTitle>{{ prompt.title }}</CardTitle>
              <CardDescription v-if="prompt.description">
                {{ prompt.description }}
              </CardDescription>
              <CardAction v-if="prompt.isOwner">
                <Button variant="ghost" size="sm" as-child>
                  <RouterLink :to="{ name: 'edit-prompt', params: { slug: prompt.slug } }">
                    <Pencil class="h-4 w-4" />
                    Edit
                  </RouterLink>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent v-if="prompt.tags.length > 0">
              <div class="flex flex-wrap gap-2">
                <Badge v-for="tag in prompt.tags" :key="tag" variant="secondary">
                  {{ tag }}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <!-- Content card with Monaco editor (FR-004, FR-005) -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base">Content</CardTitle>
              <CardAction class="flex items-center gap-2">
                <p v-if="copyError" class="text-xs text-destructive" role="alert">
                  {{ copyError }}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Copy prompt content to clipboard"
                  @click="copyContent"
                >
                  <Check v-if="copied" class="h-4 w-4" />
                  <Copy v-else class="h-4 w-4" />
                  {{ copied ? 'Copied!' : 'Copy' }}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <MonacoEditor :model-value="prompt.content" :disabled="true" />
            </CardContent>
          </Card>
        </div>

        <!-- Sidebar (FR-007, FR-011) -->
        <aside>
          <AuthorCard
            :full-name="prompt.author.fullName"
            :job-title="prompt.author.jobTitle ?? undefined"
            :prompt-count="prompt.author.promptCount"
            :skill-count="prompt.author.skillCount"
            :agent-count="prompt.author.agentCount"
            :workflow-count="prompt.author.workflowCount"
            :profile-url="`/profiles/${prompt.author.profileSlug}`"
          />
        </aside>
      </div>
    </template>
  </div>
</template>
