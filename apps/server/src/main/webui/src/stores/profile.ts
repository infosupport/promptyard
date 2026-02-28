import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getCurrentProfile, type UserProfile } from '@/services/profiles'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile | null>(null)
  const loaded = ref(false)
  const error = ref(false)

  async function fetchProfile() {
    if (loaded.value) return
    try {
      profile.value = await getCurrentProfile()
      error.value = false
    } catch {
      error.value = true
    } finally {
      loaded.value = true
    }
  }

  async function refreshProfile() {
    try {
      profile.value = await getCurrentProfile()
      error.value = false
    } catch {
      error.value = true
    } finally {
      loaded.value = true
    }
  }

  function setProfile(p: UserProfile) {
    profile.value = p
    loaded.value = true
    error.value = false
  }

  function $reset() {
    profile.value = null
    loaded.value = false
    error.value = false
  }

  return { profile, loaded, error, fetchProfile, refreshProfile, setProfile, $reset }
})
