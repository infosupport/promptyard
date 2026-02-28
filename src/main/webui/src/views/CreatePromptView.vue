<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { createPrompt } from '@/services/prompts'
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

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true
  apiError.value = ''

  try {
    const response = await createPrompt({
      title: values.title,
      description: values.description || '',
      content: values.content,
      tags: values.tags,
    })

    bypass()
    router.push({ name: 'prompt-detail', params: { slug: response.slug } })
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      apiError.value = 'Your profile was not found. Please complete onboarding first.'
    } else {
      apiError.value = 'Something went wrong while creating the prompt. Please try again.'
    }
  } finally {
    submitting.value = false
  }
})

function onCancel() {
  router.back()
}

defineExpose({ form, onSubmit, submitting })
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <div class="mb-6">
      <h1 class="text-2xl font-bold tracking-tight">Create Prompt</h1>
      <p class="text-muted-foreground mt-1">Write and publish a new prompt.</p>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-6">
      <FormField v-slot="{ componentField }" name="title">
        <FormItem>
          <FormLabel>Title</FormLabel>
          <FormControl>
            <Input type="text" placeholder="e.g. Code Review Checklist" v-bind="componentField" />
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
  </div>
</template>
