<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { updateProfile } from '@/services/profiles'
import { useProfileStore } from '@/stores/profile'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import AppBreadcrumb, { type BreadcrumbSegment } from '@/components/navigation/AppBreadcrumb.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const router = useRouter()
const profileStore = useProfileStore()

const submitting = ref(false)
const apiError = ref('')

const breadcrumbSegments: BreadcrumbSegment[] = [
  { label: 'Promptyard', to: '/' },
  { label: 'Profiles' },
  { label: 'Me', to: '/profiles/me' },
  { label: 'Edit Details' },
]

const formSchema = toTypedSchema(
  z.object({
    jobTitle: z.string().optional().default(''),
    businessUnit: z.string().optional().default(''),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    jobTitle: profileStore.profile?.jobTitle ?? '',
    businessUnit: profileStore.profile?.businessUnit ?? '',
  },
})

const isDirty = computed(() => form.meta.value.dirty)
const { showDialog, confirmLeave, cancelLeave, bypass } = useUnsavedChanges(isDirty)

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true
  apiError.value = ''

  try {
    await updateProfile({
      jobTitle: values.jobTitle || null,
      businessUnit: values.businessUnit || null,
    })

    await profileStore.refreshProfile()
    bypass()
    router.push({ name: 'my-profile' })
  } catch {
    apiError.value = 'Something went wrong while saving your profile. Please try again.'
  } finally {
    submitting.value = false
  }
})

function onCancel() {
  router.push({ name: 'my-profile' })
}

defineExpose({ form, onSubmit, submitting, apiError })
</script>

<template>
  <div>
    <AppBreadcrumb :segments="breadcrumbSegments" />

    <Card class="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-1 mb-6">
          <p class="text-sm text-muted-foreground">Name</p>
          <p class="text-sm font-medium">{{ profileStore.profile?.fullName }}</p>
          <p class="text-sm text-muted-foreground mt-3">Email</p>
          <p class="text-sm font-medium">{{ profileStore.profile?.emailAddress }}</p>
        </div>

        <form @submit.prevent="onSubmit" class="space-y-6">
          <FormField v-slot="{ componentField }" name="jobTitle">
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="e.g. Software Engineer"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="businessUnit">
            <FormItem>
              <FormLabel>Business Unit</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="e.g. Engineering"
                  v-bind="componentField"
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
      </CardContent>
    </Card>

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
