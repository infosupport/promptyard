import { ref, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue'
import { onBeforeRouteLeave, useRouter, type RouteLocationNormalized } from 'vue-router'

export function useUnsavedChanges(isDirty: Ref<boolean> | ComputedRef<boolean>) {
  const router = useRouter()
  const showDialog = ref(false)
  const pendingRoute = ref<RouteLocationNormalized | null>(null)
  const bypassing = ref(false)

  onBeforeRouteLeave((to) => {
    if (bypassing.value) return true
    if (isDirty.value) {
      pendingRoute.value = to
      showDialog.value = true
      return false
    }
    return true
  })

  function onBeforeUnload(event: BeforeUnloadEvent) {
    if (isDirty.value && !bypassing.value) {
      event.preventDefault()
    }
  }

  onMounted(() => {
    window.addEventListener('beforeunload', onBeforeUnload)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeunload', onBeforeUnload)
  })

  function bypass() {
    bypassing.value = true
  }

  function confirmLeave() {
    showDialog.value = false
    bypassing.value = true
    if (pendingRoute.value) {
      router.push(pendingRoute.value)
    }
  }

  function cancelLeave() {
    showDialog.value = false
    pendingRoute.value = null
  }

  return { showDialog, confirmLeave, cancelLeave, bypass }
}
