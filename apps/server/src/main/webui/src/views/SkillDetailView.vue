<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getSkillBySlug, type SkillDetailResponse } from '@/services/skills'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AuthorCard } from '@/components/profiles'
import { AppBreadcrumb } from '@/components/navigation'
import { Copy, Check, Download } from 'lucide-vue-next'
import { CONTENT_TYPE_CONFIG } from '@/lib/content-types'
import { cn } from '@/lib/utils'

const route = useRoute()
const slug = route.params.slug as string

const skill = ref<SkillDetailResponse | null>(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const copied = ref(false)
const copyError = ref('')

const contentTypeConfig = computed(() => CONTENT_TYPE_CONFIG['skill'])

async function fetchData() {
  loading.value = true
  error.value = ''
  notFound.value = false

  try {
    skill.value = await getSkillBySlug(slug)
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      notFound.value = true
    } else {
      error.value = 'Something went wrong while loading the skill. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

async function copyPreview() {
  if (!skill.value?.previewContent) return
  copyError.value = ''
  try {
    await navigator.clipboard.writeText(skill.value.previewContent)
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

function downloadZip() {
  if (!skill.value) return
  // Trigger download
  window.location.href = `/api/content/skills/${encodeURIComponent(slug)}/download`
}

onMounted(fetchData)

defineExpose({ skill, loading, error, notFound, copied, copyError, fetchData, copyPreview })
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <p class="text-muted-foreground">Loading...</p>
    </div>

    <!-- Not found state -->
    <div v-else-if="notFound" class="flex flex-col items-center justify-center py-12 space-y-4">
      <p class="text-lg font-medium">Skill not found</p>
      <p class="text-muted-foreground">
        The skill you're looking for doesn't exist or has been removed.
      </p>
      <Button variant="outline" as-child>
        <RouterLink to="/">Back to home</RouterLink>
      </Button>
    </div>

    <!-- Error state -->
    <div v-else-if="error && !skill" class="flex flex-col items-center justify-center py-12 space-y-4">
      <p class="text-sm text-destructive" role="alert">{{ error }}</p>
      <Button variant="outline" @click="fetchData">Retry</Button>
    </div>

    <!-- Main content -->
    <template v-else-if="skill">
      <!-- Breadcrumb -->
      <AppBreadcrumb
        :segments="[
          { label: 'Promptyard', to: '/' },
          { label: 'Skills' },
          { label: skill.title },
        ]"
      />

      <div class="grid grid-cols-[1fr_auto] gap-6">
        <!-- Main column -->
        <div class="space-y-6 min-w-0">
          <!-- Metadata card -->
          <Card>
            <CardHeader>
              <div class="flex items-center gap-2">
                <component
                  :is="contentTypeConfig.icon"
                  :class="cn('size-5 shrink-0', contentTypeConfig.iconColor)"
                  :aria-label="contentTypeConfig.label"
                  role="img"
                />
                <CardTitle class="text-3xl">{{ skill.title }}</CardTitle>
              </div>
              <CardDescription v-if="skill.description">
                {{ skill.description }}
              </CardDescription>
            </CardHeader>
            <CardContent v-if="skill.tags.length > 0">
              <div class="flex flex-wrap gap-2">
                <Badge v-for="tag in skill.tags" :key="tag" variant="secondary">
                  {{ tag }}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <!-- File list card -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base">Files in Zip</CardTitle>
            </CardHeader>
            <CardContent>
              <ul class="space-y-2">
                <li
                  v-for="file in skill.files"
                  :key="file.fileName"
                  class="flex items-center justify-between p-3 bg-muted/30 rounded-md"
                >
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-sm">{{ file.fileName }}</span>
                    <span class="text-xs text-muted-foreground">
                      {{ (file.fileSize / 1024).toFixed(1) }} KB
                    </span>
                  </div>
                  <span
                    v-if="!file.isTextFile"
                    class="text-xs text-muted-foreground italic"
                  >
                    Binary file
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <!-- Preview card (if available) -->
          <Card v-if="skill.previewContent">
            <CardHeader>
              <CardTitle class="text-base">Preview (SKILL.md)</CardTitle>
              <CardDescription>First 10,000 characters</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="relative">
                <pre class="min-h-[200px] p-4 bg-muted/50 rounded-md overflow-auto font-mono text-sm whitespace-pre-wrap">{{ skill.previewContent }}</pre>
                <Button
                  variant="ghost"
                  size="sm"
                  class="absolute top-2 right-2"
                  aria-label="Copy preview to clipboard"
                  @click="copyPreview"
                >
                  <Check v-if="copied" class="h-4 w-4" />
                  <Copy v-else class="h-4 w-4" />
                  {{ copied ? 'Copied!' : 'Copy' }}
                </Button>
              </div>
            </CardContent>
          </Card>

          <!-- Download card -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base">Download</CardTitle>
            </CardHeader>
            <CardContent>
              <Button @click="downloadZip">
                <Download class="h-4 w-4 mr-2" />
                Download Zip ({{ (skill.fileSize / 1024 / 1024).toFixed(2) }} MB)
              </Button>
            </CardContent>
          </Card>
        </div>

        <!-- Sidebar -->
        <aside>
          <AuthorCard
            :full-name="skill.author.fullName"
            :job-title="skill.author.jobTitle ?? undefined"
            :prompt-count="0"
            :skill-count="0"
            :agent-count="0"
            :workflow-count="0"
            :profile-url="`/profiles/${skill.author.profileSlug}`"
          />
        </aside>
      </div>
    </template>
  </div>
</template>
