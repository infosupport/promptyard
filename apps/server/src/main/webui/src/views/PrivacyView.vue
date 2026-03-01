<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import privacyMarkdown from '@docs/legal/privacy-statement.md?raw'

const privacyHtml = computed(() => marked.parse(privacyMarkdown) as string)
</script>

<template>
  <article class="prose max-w-none" v-html="privacyHtml" />
</template>
