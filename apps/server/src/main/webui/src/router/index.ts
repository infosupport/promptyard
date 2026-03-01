import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useProfileStore } from '@/stores/profile'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/welcome',
      name: 'welcome',
      component: () => import('@/views/WelcomeView.vue'),
    },
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: 'search',
          name: 'search',
          component: () => import('@/views/SearchView.vue'),
        },
        {
          path: 'content/prompts/new',
          name: 'create-prompt',
          component: () => import('@/views/CreatePromptView.vue'),
        },
        {
          path: 'content/prompts/:slug',
          name: 'prompt-detail',
          component: () => import('@/views/PromptDetailView.vue'),
        },
        {
          path: 'content/prompts/:slug/edit',
          name: 'edit-prompt',
          component: () => import('@/views/EditPromptView.vue'),
        },
        {
          path: 'profiles/me',
          name: 'my-profile',
          component: () => import('@/views/MyProfileView.vue'),
        },
        {
          path: 'profiles/me/edit',
          name: 'edit-profile',
          component: () => import('@/views/EditProfileView.vue'),
        },
        {
          path: 'profiles/:slug',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
        },
        {
          path: 'privacy',
          name: 'privacy',
          component: () => import('@/views/PrivacyView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.name === 'welcome' || to.name === 'privacy') return true

  const profileStore = useProfileStore()
  await profileStore.fetchProfile()

  if (profileStore.error) return true
  if (!profileStore.profile) return { name: 'welcome' }
  return true
})

export default router
