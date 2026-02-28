<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import {
  getPromptBySlug,
  updatePrompt,
  type PromptDetailResponse,
} from '@/services/prompts'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MonacoEditor, TagInput } from '@/components/content'

const router = useRouter()
const route = useRoute()
const slug = route.params.slug as string

const loading = ref(true)
const notFound = ref(false)
const loadError = ref('')
const submitting = ref(false)
const apiError = ref('')

const formSchema = toTypedSchema(
  z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional().default(''),
    content: z.string().min(1, 'Content is required'),
    tags: z.array(z.string()).min(1, 'At least one tag is required'),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    title: '',
    description: '',
    content: '',
    tags: [] as string[],
  },
})

const isDirty = computed(() => form.meta.value.dirty)
const { showDialog, confirmLeave, cancelLeave, bypass } = useUnsavedChanges(isDirty)

async function fetchPrompt() {
  loading.value = true
  loadError.value = ''
  notFound.value = false

  try {
    const data: PromptDetailResponse = await getPromptBySlug(slug)
    form.resetForm({
      values: {
        title: data.title,
        description: data.description,
        content: data.content,
        tags: data.tags,
      },
    })
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      notFound.value = true
    } else {
      loadError.value = 'Something went wrong while loading the prompt. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true
  apiError.value = ''

  try {
    await updatePrompt(slug, {
      title: values.title,
      description: values.description || '',
      content: values.content,
      tags: values.tags,
    })

    bypass()
    router.push({ name: 'prompt-detail', params: { slug } })
  } catch (error) {
    if (error instanceof Error && error.message.includes('403')) {
      apiError.value = 'You do not have permission to edit this prompt.'
    } else if (error instanceof Error && error.message.includes('404')) {
      apiError.value = 'This prompt no longer exists.'
    } else {
      apiError.value = 'Something went wrong while saving the prompt. Please try again.'
    }
  } finally {
    submitting.value = false
  }
})

function onCancel() {
  router.push({ name: 'prompt-detail', params: { slug } })
}

onMounted(fetchPrompt)

defineExpose({ form, onSubmit, submitting, loading, notFound, loadError, apiError, fetchPrompt })
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <p class="text-muted-foreground">Loading...</p>
    </div>

    <!-- Not found state -->
    <div v-else-if="notFound" class="flex flex-col items-center justify-center py-12 space-y-4">
      <p class="text-lg font-medium">Prompt not found</p>
      <p class="text-muted-foreground">
        The prompt you're looking for doesn't exist or has been removed.
      </p>
      <Button variant="outline" as-child>
        <RouterLink to="/">Back to home</RouterLink>
      </Button>
    </div>

    <!-- Load error state -->
    <div
      v-else-if="loadError"
      class="flex flex-col items-center justify-center py-12 space-y-4"
    >
      <p class="text-sm text-destructive" role="alert">{{ loadError }}</p>
      <Button variant="outline" @click="fetchPrompt">Retry</Button>
    </div>

    <!-- Edit form -->
    <template v-else>
      <div class="mb-6">
        <h1 class="text-2xl font-bold tracking-tight">Edit Prompt</h1>
        <p class="text-muted-foreground mt-1">Update your prompt's details and content.</p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-6">
        <FormField v-slot="{ componentField }" name="title">
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="e.g. Code Review Checklist"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="description">
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="A short description of what this prompt does"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField v-slot="{ value, handleChange }" name="content">
          <FormItem>
            <FormLabel>Content</FormLabel>
            <FormControl>
              <MonacoEditor :model-value="value ?? ''" @update:model-value="handleChange" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="tags">
          <FormItem>
            <FormLabel>Tags</FormLabel>
            <FormControl>
              <TagInput
                :model-value="form.values.tags ?? []"
                @update:model-value="(val: string[]) => form.setFieldValue('tags', val)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <p v-if="apiError" class="text-sm text-destructive" role="alert">{{ apiError }}</p>

        <div class="flex items-center gap-3">
          <Button type="submit" :disabled="submitting">
            {{ submitting ? 'Saving...' : 'Save' }}
          </Button>
          <Button type="button" variant="outline" :disabled="submitting" @click="onCancel">
            Cancel
          </Button>
        </div>
      </form>

      <AlertDialog :open="showDialog">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave this page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel @click="cancelLeave">Stay</AlertDialogCancel>
            <AlertDialogAction @click="confirmLeave">Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </template>
  </div>
</template>
