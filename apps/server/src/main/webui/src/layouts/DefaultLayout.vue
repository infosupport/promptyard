<script setup lang="ts">
import { NavigationBar } from '@/components/navigation'
import { AppFooter } from '@/components/layout'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <NavigationBar />
    <main class="container mx-auto flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>
