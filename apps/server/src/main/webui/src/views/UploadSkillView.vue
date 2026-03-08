<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { createSkill } from '@/services/skills'
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
import { TagInput } from '@/components/content'

const router = useRouter()

const submitting = ref(false)
const apiError = ref('')

const formSchema = toTypedSchema(
  z.object({
    title: z.string().min(1, 'Name is required'),
    description: z.string().optional().default(''),
    tags: z.array(z.string()).min(1, 'At least one tag is required'),
    zipFile: z.instanceof(File).optional().nullable().refine((file) => !file || file.size <= 10 * 1024 * 1024, {
      message: 'The zip file must be smaller than 10 MB',
    }),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    title: '',
    description: '',
    tags: [] as string[],
    zipFile: null as File | null,
  },
})

const isDirty = computed(() => form.meta.value.dirty)
const { showDialog, confirmLeave, cancelLeave, bypass } = useUnsavedChanges(isDirty)

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true
  apiError.value = ''

  try {
    if (!values.zipFile) {
      throw new Error('No zip file selected')
    }

    const response = await createSkill({
      title: values.title,
      description: values.description || '',
      tags: values.tags,
      zipFile: values.zipFile,
    })

    bypass()
    router.push({ name: 'skill-detail', params: { slug: response.slug } })
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      apiError.value = 'Your profile was not found. Please complete onboarding first.'
    } else if (error instanceof Error && error.message.includes('SKILL.md')) {
      apiError.value = error.message
    } else {
      apiError.value = 'Something went wrong while creating the skill. Please try again.'
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
      <h1 class="text-2xl font-bold tracking-tight">Upload Skill</h1>
      <p class="text-muted-foreground mt-1">
        Share a reusable skill as a zip file. The zip must contain a SKILL.md file at its root.
      </p>
    </div>

    <form @submit.prevent="onSubmit" class="space-y-6">
      <FormField v-slot="{ componentField }" name="title">
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input type="text" placeholder="e.g. Kotlin Coroutines Pattern" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="description">
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Textarea
              placeholder="A short description of what this skill covers"
              v-bind="componentField"
            />
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

      <FormField v-slot="{ value, handleChange }" name="zipFile">
        <FormItem>
          <FormLabel>Zip File</FormLabel>
          <FormControl>
            <div class="flex items-center gap-4">
              <Input
                type="file"
                accept=".zip"
                @change="(e: Event) => handleChange((e.target as HTMLInputElement).files?.[0] || null)"
              />
            </div>
          </FormControl>
          <FormMessage />
          <FormDescription>
            Maximum file size: 10 MB. Must contain SKILL.md at the root.
          </FormDescription>
        </FormItem>
      </FormField>

      <p v-if="apiError" class="text-sm text-destructive" role="alert">{{ apiError }}</p>

      <div class="flex items-center gap-3">
        <Button type="submit" :disabled="submitting">
          {{ submitting ? 'Uploading...' : 'Upload' }}
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
