<script setup lang="ts">
import { NavigationBar } from '@/components/navigation'
</script>

<template>
  <div class="min-h-screen bg-background">
    <NavigationBar />
    <main class="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <RouterView />
    </main>
  </div>
</template>
