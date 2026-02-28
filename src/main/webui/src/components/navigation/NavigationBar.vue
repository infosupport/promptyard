<script setup lang="ts">
import NavigationSearch from './NavigationSearch.vue'
import NavigationCreateMenu from './NavigationCreateMenu.vue'
import NavigationUserMenu from './NavigationUserMenu.vue'
</script>

<template>
  <nav
    class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
  >
    <div class="mx-auto container flex h-14 items-center gap-8 px-4 sm:px-6 lg:px-8">
      <RouterLink to="/" class="shrink-0 font-semibold text-lg">Promptyard</RouterLink>

      <NavigationSearch />

      <div class="flex shrink-0 items-center gap-2">
        <NavigationCreateMenu />
        <NavigationUserMenu />
      </div>
    </div>
  </nav>
</template>
