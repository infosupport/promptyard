import { ref, nextTick, onMounted, type Ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'

export function useTagOverflow(
  containerRef: Ref<HTMLElement | null>,
  totalCount: Ref<number>,
) {
  const visibleCount = ref(0)
  const hiddenCount = ref(0)

  function measure() {
    const container = containerRef.value
    if (!container || totalCount.value === 0) {
      visibleCount.value = totalCount.value
      hiddenCount.value = 0
      return
    }

    // Get all badge children (exclude the "+N more" indicator)
    const children = Array.from(container.children).filter(
      (el) => !el.hasAttribute('data-overflow-indicator'),
    )

    if (children.length === 0) {
      visibleCount.value = 0
      hiddenCount.value = 0
      return
    }

    const containerTop = children[0]!.getBoundingClientRect().top
    let count = 0

    for (const child of children) {
      if (child.getBoundingClientRect().top > containerTop) break
      count++
    }

    // If not all tags fit, reserve space for the "+N more" indicator
    // by reducing visible count by 1 to make room
    if (count < totalCount.value) {
      visibleCount.value = Math.max(count - 1, 1)
    } else {
      visibleCount.value = count
    }

    hiddenCount.value = totalCount.value - visibleCount.value
  }

  onMounted(async () => {
    await nextTick()
    measure()
  })

  useResizeObserver(containerRef, () => {
    measure()
  })

  return { visibleCount, hiddenCount }
}
