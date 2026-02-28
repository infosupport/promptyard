<script setup lang="ts">
import { useProfileStore } from '@/stores/profile'
import { useMyContent } from '@/composables/useMyContent'
import { ProfileDetailsCard } from '@/components/profiles'
import { ContentItemList } from '@/components/content'
import { AppBreadcrumb } from '@/components/navigation'

const profileStore = useProfileStore()
const { items, pageIndex, totalPages, loading, fetchPage } = useMyContent()
</script>

<template>
  <div>
    <!-- Breadcrumb (FR-008) -->
    <AppBreadcrumb :segments="[{ label: 'Profiles' }, { label: 'Me' }]" />

    <!-- Profile details card (FR-003)
         Content counts are hardcoded to 0 — the /api/profiles/me endpoint
         doesn't provide counts yet. To be enhanced when backend adds support. -->
    <div class="mb-6">
      <ProfileDetailsCard
        v-if="profileStore.profile"
        :full-name="profileStore.profile.fullName"
        :job-title="profileStore.profile.jobTitle ?? undefined"
        :business-unit="profileStore.profile.businessUnit ?? undefined"
        :member-since="profileStore.profile.createdAt"
        :prompt-count="0"
        :skill-count="0"
        :agent-count="0"
        :workflow-count="0"
        :show-edit-button="true"
        edit-url="/profiles/me/edit"
      />
    </div>

    <!-- Content list (FR-006) -->
    <h2 class="text-xl font-semibold mb-4">Shared content</h2>
    <ContentItemList
      :items="items"
      :page-index="pageIndex"
      :total-pages="totalPages"
      :loading="loading"
      @page-change="fetchPage"
    />
  </div>
</template>
