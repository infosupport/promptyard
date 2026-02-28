export interface ContentPageItemAuthor {
  fullName: string
}

export interface ContentPageItem {
  slug: string
  title: string
  description: string
  tags: string[]
  contentType: string
  author: ContentPageItemAuthor
  createdAt: string
  modifiedAt: string | null
}

export interface ContentPageResponse {
  items: ContentPageItem[]
  pageIndex: number
  totalPages: number
}

export async function getAllContent(page: number = 0): Promise<ContentPageResponse> {
  const response = await fetch(`/api/content?page=${page}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch content: ${response.status}`)
  }
  return response.json()
}
