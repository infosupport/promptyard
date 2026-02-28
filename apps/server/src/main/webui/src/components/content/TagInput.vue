<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { X } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    placeholder: 'Add a tag and press Enter',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [tags: string[]]
}>()

const inputValue = ref('')
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')

function addTag() {
  const tag = inputValue.value.trim().toLowerCase()
  if (!tag) return

  const isDuplicate = props.modelValue.some((t) => t.toLowerCase() === tag)
  if (isDuplicate) {
    inputValue.value = ''
    return
  }

  emit('update:modelValue', [...props.modelValue, tag])
  inputValue.value = ''
}

function removeTag(index: number) {
  const newTags = props.modelValue.filter((_, i) => i !== index)
  emit('update:modelValue', newTags)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    addTag()
  } else if (event.key === 'Backspace' && inputValue.value === '' && props.modelValue.length > 0) {
    removeTag(props.modelValue.length - 1)
  }
}

function focusInput() {
  inputRef.value?.focus()
}
</script>

<template>
  <div
    role="group"
    aria-label="Tags"
    class="border-input bg-background flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border px-3 py-1.5"
    :class="{ 'opacity-50': disabled }"
    @click="focusInput"
  >
    <Badge
      v-for="(tag, index) in modelValue"
      :key="`${tag}-${index}`"
      variant="secondary"
      class="gap-1 pr-1"
    >
      {{ tag }}
      <button
        type="button"
        :aria-label="`Remove tag ${tag}`"
        :disabled="disabled"
        class="hover:bg-muted rounded-sm p-0.5"
        @click.stop="removeTag(index)"
      >
        <X class="size-3" />
      </button>
    </Badge>
    <input
      ref="inputRef"
      v-model="inputValue"
      type="text"
      :placeholder="modelValue.length === 0 ? placeholder : ''"
      :disabled="disabled"
      :aria-label="placeholder"
      class="placeholder:text-muted-foreground min-w-20 flex-1 bg-transparent text-sm outline-none"
      @keydown="onKeydown"
      @blur="addTag"
    />
  </div>
</template>
