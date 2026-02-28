export interface AuthorSummary {
  fullName: string
  jobTitle: string | null
  profileSlug: string
  promptCount: number
  skillCount: number
  agentCount: number
  workflowCount: number
}

export interface PromptDetailResponse {
  title: string
  slug: string
  description: string
  content: string
  tags: string[]
  contentType: string
  createdAt: string
  modifiedAt: string | null
  author: AuthorSummary
  isOwner: boolean
}

export async function getPromptBySlug(slug: string): Promise<PromptDetailResponse> {
  const response = await fetch(`/api/content/prompts/${encodeURIComponent(slug)}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch prompt: ${response.status}`)
  }
  return response.json()
}

export interface SubmitPromptRequest {
  title: string
  description: string
  content: string
  tags: string[]
}

export interface SubmitPromptResponse {
  slug: string
}

export async function createPrompt(
  request: SubmitPromptRequest,
): Promise<SubmitPromptResponse> {
  const response = await fetch('/api/content/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error(`Failed to create prompt: ${response.status}`)
  }
  return response.json()
}

export interface UpdatePromptRequest {
  title: string
  description: string
  content: string
  tags: string[]
}

export interface UpdatePromptResponse {
  slug: string
}

export async function updatePrompt(
  slug: string,
  request: UpdatePromptRequest,
): Promise<UpdatePromptResponse> {
  const response = await fetch(`/api/content/prompts/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error(`Failed to update prompt: ${response.status}`)
  }
  return response.json()
}
