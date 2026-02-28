<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getProfileBySlug, type UserProfile } from '@/services/profiles'
import { useProfileStore } from '@/stores/profile'
import { useProfileContent } from '@/composables/useProfileContent'
import { ProfileDetailsCard } from '@/components/profiles'
import { ContentItemList } from '@/components/content'
import { AppBreadcrumb } from '@/components/navigation'
import { Button } from '@/components/ui/button'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const profileStore = useProfileStore()

const profile = ref<UserProfile | null>(null)
const loading = ref(true)
const error = ref(false)
const notFound = ref(false)

const isOwnProfile = computed(() => profileStore.profile?.slug === slug.value)

const {
  items: contentItems,
  pageIndex: contentPageIndex,
  totalPages: contentTotalPages,
  loading: contentLoading,
  fetchPage: fetchContentPage,
} = useProfileContent(slug.value)

async function fetchProfile() {
  loading.value = true
  error.value = false
  notFound.value = false

  try {
    profile.value = await getProfileBySlug(slug.value)
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      notFound.value = true
    } else {
      error.value = true
    }
  } finally {
    loading.value = false
  }
}

watch(slug, () => {
  fetchProfile()
  fetchContentPage(0)
})

onMounted(fetchProfile)
</script>

<template>
  <div>
    <!-- Loading state (FR-010) -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <p class="text-muted-foreground">Loading...</p>
    </div>

    <!-- Not found state (FR-012) -->
    <div v-else-if="notFound" class="flex flex-col items-center justify-center py-12 space-y-4">
      <p class="text-lg font-medium">Profile not found</p>
      <p class="text-muted-foreground">
        The profile you're looking for doesn't exist or has been removed.
      </p>
      <Button variant="outline" as-child>
        <RouterLink to="/">Back to home</RouterLink>
      </Button>
    </div>

    <!-- Error state (EC-5) -->
    <div
      v-else-if="error && !profile"
      class="flex flex-col items-center justify-center py-12 space-y-4"
    >
      <p class="text-sm text-destructive" role="alert">
        Something went wrong while loading the profile. Please try again.
      </p>
      <Button variant="outline" @click="fetchProfile">Retry</Button>
    </div>

    <!-- Main content -->
    <template v-else-if="profile">
      <!-- Breadcrumb (FR-008) -->
      <AppBreadcrumb
        :segments="[{ label: 'Profiles' }, { label: profile.fullName }]"
      />

      <!-- Profile details card (FR-003, FR-009) -->
      <div class="mb-6">
        <ProfileDetailsCard
          :full-name="profile.fullName"
          :job-title="profile.jobTitle ?? undefined"
          :business-unit="profile.businessUnit ?? undefined"
          :member-since="profile.createdAt"
          :prompt-count="0"
          :skill-count="0"
          :agent-count="0"
          :workflow-count="0"
          :show-edit-button="isOwnProfile"
          :edit-url="isOwnProfile ? '/profiles/me/edit' : undefined"
        />
      </div>

      <!-- Content list (FR-006) -->
      <h2 class="text-xl font-semibold mb-4">Content</h2>
      <ContentItemList
        :items="contentItems"
        :page-index="contentPageIndex"
        :total-pages="contentTotalPages"
        :loading="contentLoading"
        @page-change="fetchContentPage"
      />
    </template>
  </div>
</template>
