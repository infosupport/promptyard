export interface CommentResponse {
  id: number
  text: string
  createdAt: string
  authorFullName: string
}

export interface CreateCommentRequest {
  text: string
}

export async function getComments(slug: string): Promise<CommentResponse[]> {
  const response = await fetch(
    `/api/content/prompts/${encodeURIComponent(slug)}/comments`,
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${response.status}`)
  }
  return response.json()
}

export async function createComment(
  slug: string,
  request: CreateCommentRequest,
): Promise<CommentResponse> {
  const response = await fetch(
    `/api/content/prompts/${encodeURIComponent(slug)}/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
  )
  if (!response.ok) {
    throw new Error(`Failed to create comment: ${response.status}`)
  }
  return response.json()
}
