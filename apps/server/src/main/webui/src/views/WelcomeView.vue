<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import { useProfileStore } from '@/stores/profile'
import { createProfile, getCurrentProfile } from '@/services/profiles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const router = useRouter()
const profileStore = useProfileStore()

const submitting = ref(false)
const apiError = ref('')

const formSchema = toTypedSchema(
  z.object({
    jobTitle: z.string().optional(),
    businessUnit: z.string().optional(),
    privacyAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the privacy statement to continue.',
    }),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    jobTitle: '',
    businessUnit: '',
    privacyAccepted: false,
  },
})

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true
  apiError.value = ''

  try {
    const { slug } = await createProfile({
      jobTitle: values.jobTitle || null,
      businessUnit: values.businessUnit || null,
      privacyAccepted: values.privacyAccepted,
    })

    const profile = await getCurrentProfile()
    if (profile) {
      profileStore.setProfile(profile)
    }

    router.push({ path: `/profiles/${slug}` })
  } catch {
    apiError.value = 'Something went wrong while creating your profile. Please try again.'
  } finally {
    submitting.value = false
  }
})

defineExpose({ form, onSubmit })
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-2xl">Welcome to Promptyard</CardTitle>
        <CardDescription>
          Set up your profile to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="profileStore.profile" class="space-y-4">
          <p class="text-sm text-muted-foreground">
            You are already onboarded. You can go to the
            <RouterLink to="/" class="text-primary underline">home page</RouterLink>.
          </p>
        </div>

        <form v-else @submit="onSubmit" class="space-y-6">
          <FormField v-slot="{ componentField }" name="jobTitle">
            <FormItem>
              <FormLabel>Job title</FormLabel>
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
              <FormLabel>Business unit</FormLabel>
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

          <FormField v-slot="{ value, handleChange }" name="privacyAccepted">
            <FormItem class="flex flex-row items-start gap-x-3 space-y-0">
              <FormControl>
                <Checkbox :model-value="value" @update:model-value="handleChange" />
              </FormControl>
              <div class="space-y-1 leading-none">
                <FormLabel class="font-normal">
                  I accept the
                  <RouterLink to="/privacy" class="text-primary underline">
                    privacy statement
                  </RouterLink>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          </FormField>

          <p v-if="apiError" class="text-sm text-destructive" role="alert">
            {{ apiError }}
          </p>

          <Button type="submit" class="w-full" :disabled="submitting">
            {{ submitting ? 'Creating profile...' : 'Get started' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
