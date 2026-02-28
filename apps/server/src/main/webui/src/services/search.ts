import type { ContentPageResponse } from '@/services/content'

export async function searchContent(
  query: string,
  page: number = 0,
  signal?: AbortSignal,
): Promise<ContentPageResponse> {
  const params = new URLSearchParams({ q: query, page: String(page) })
  const response = await fetch(`/api/search?${params}`, { signal })
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`)
  }
  return response.json()
}
