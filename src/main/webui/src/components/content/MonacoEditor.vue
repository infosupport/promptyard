<script setup lang="ts">
import { computed } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'

const props = withDefaults(
  defineProps<{
    modelValue: string
    language?: string
    disabled?: boolean
  }>(),
  {
    language: 'markdown',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorOptions = computed(() => ({
  lineNumbers: 'on' as const,
  minimap: { enabled: false },
  wordWrap: 'on' as const,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  fontSize: 14,
  readOnly: props.disabled,
}))

function handleChange(value: string | undefined) {
  emit('update:modelValue', value ?? '')
}
</script>

<template>
  <div class="h-[300px] border rounded-md">
    <VueMonacoEditor
      :value="modelValue"
      :language="language"
      :options="editorOptions"
      @change="handleChange"
    >
      <template #default>
        <div class="flex items-center justify-center h-full min-h-[300px] bg-muted text-muted-foreground text-sm">
          Loading editor...
        </div>
      </template>
    </VueMonacoEditor>
  </div>
</template>
