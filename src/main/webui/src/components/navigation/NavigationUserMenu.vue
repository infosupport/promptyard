<script setup lang="ts">
import { computed } from 'vue'
import { LogOut, User } from 'lucide-vue-next'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getInitials } from '@/lib/format'
import { RouterLink } from 'vue-router'
import { useProfileStore } from '@/stores/profile'

const profileStore = useProfileStore()
const userName = computed(() => profileStore.profile?.fullName ?? '')
const userEmail = computed(() => profileStore.profile?.emailAddress ?? '')
const initials = computed(() => getInitials(userName.value))
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button class="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar class="h-8 w-8">
          <AvatarFallback>{{ initials }}</AvatarFallback>
        </Avatar>
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel>
        <div class="flex flex-col space-y-1">
          <p class="text-sm font-medium leading-none">{{ userName }}</p>
          <p class="text-xs leading-none text-muted-foreground">{{ userEmail }}</p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem as-child>
        <RouterLink to="/profiles/me">
          <User class="mr-2 h-4 w-4" />
          View Profile
        </RouterLink>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem as="a" href="/api/logout">
        <LogOut class="mr-2 h-4 w-4" />
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
