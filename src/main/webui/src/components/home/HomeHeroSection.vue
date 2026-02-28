<script setup lang="ts">
import NavigationCreateMenu from '@/components/navigation/NavigationCreateMenu.vue'
</script>

<template>
  <section class="flex flex-col items-center gap-4 py-12 text-center">
    <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
      Help your colleagues adopt AI
    </h1>
    <p class="max-w-xl text-muted-foreground">
      Share your prompts, skills, agents, and workflows with the rest of the organization.
    </p>
    <NavigationCreateMenu variant="default" size="lg" />
  </section>
</template>
