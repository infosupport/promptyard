<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import {
  getComments,
  createComment,
  type CommentResponse,
} from '@/services/comments'
import { formatRelativeTime } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'

const props = defineProps<{
  slug: string
}>()

const comments = ref<CommentResponse[]>([])
const loading = ref(true)
const fetchError = ref('')
const submitError = ref('')
const submitting = ref(false)

const formSchema = toTypedSchema(
  z.object({
    text: z
      .string()
      .refine((val) => val.trim().length > 0, 'Comment text is required'),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    text: '',
  },
})

async function fetchComments() {
  loading.value = true
  fetchError.value = ''

  try {
    comments.value = await getComments(props.slug)
  } catch {
    fetchError.value = 'Failed to load comments. Please try again.'
  } finally {
    loading.value = false
  }
}

const onSubmit = form.handleSubmit(async (values) => {
  submitting.value = true
  submitError.value = ''

  try {
    const newComment = await createComment(props.slug, { text: values.text })
    comments.value.unshift(newComment)
    form.resetForm()
  } catch {
    submitError.value = 'Failed to post comment. Please try again.'
  } finally {
    submitting.value = false
  }
})

onMounted(fetchComments)

</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-base">Comments</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Comment form -->
      <form @submit.prevent="onSubmit" class="space-y-3">
        <FormField v-slot="{ componentField }" name="text">
          <FormItem>
            <FormControl>
              <Textarea
                placeholder="Write a comment..."
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <p v-if="submitError" class="text-sm text-destructive" role="alert">
          {{ submitError }}
        </p>

        <div class="flex justify-end">
          <Button type="submit" size="sm" :disabled="submitting">
            {{ submitting ? 'Posting...' : 'Post comment' }}
          </Button>
        </div>
      </form>

      <!-- Loading state -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="space-y-2">
          <Skeleton class="h-4 w-32" />
          <Skeleton class="h-4 w-full" />
        </div>
      </div>

      <!-- Fetch error state -->
      <div v-else-if="fetchError" class="text-center py-4 space-y-3">
        <p class="text-sm text-destructive" role="alert">{{ fetchError }}</p>
        <Button variant="outline" size="sm" @click="fetchComments">Retry</Button>
      </div>

      <!-- Empty state -->
      <p
        v-else-if="comments.length === 0"
        class="text-sm text-muted-foreground text-center py-4"
      >
        No comments yet
      </p>

      <!-- Comments list -->
      <div v-else class="space-y-4">
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="border-b pb-4 last:border-b-0 last:pb-0"
        >
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm font-medium">{{ comment.authorFullName }}</span>
            <span class="text-xs text-muted-foreground">
              {{ formatRelativeTime(comment.createdAt) }}
            </span>
          </div>
          <p class="text-sm whitespace-pre-wrap">{{ comment.text }}</p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
