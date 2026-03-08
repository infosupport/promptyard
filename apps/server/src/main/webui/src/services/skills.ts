export interface SkillFileResponse {
  fileName: string
  fileSize: number
  isTextFile: boolean
}

export interface SkillDetailResponse {
  title: string
  slug: string
  description: string
  tags: string[]
  contentType: string
  createdAt: string
  modifiedAt: string | null
  author: {
    fullName: string
    jobTitle: string | null
    profileSlug: string
  }
  isOwner: boolean
  fileCount: number
  fileSize: number
  files: SkillFileResponse[]
  previewContent: string | null
}

export async function getSkillBySlug(slug: string): Promise<SkillDetailResponse> {
  const response = await fetch(`/api/content/skills/${encodeURIComponent(slug)}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch skill: ${response.status}`)
  }
  return response.json()
}

export interface SubmitSkillRequest {
  title: string
  description: string
  tags: string[]
  zipFile: File
}

export interface SubmitSkillResponse {
  slug: string
}

export async function createSkill(
  request: SubmitSkillRequest,
): Promise<SubmitSkillResponse> {
  const formData = new FormData()
  formData.append('title', request.title)
  formData.append('description', request.description)
  formData.append('tags', JSON.stringify(request.tags))
  formData.append('zipFile', request.zipFile)

  // For now, we'll use a simple JSON approach - the backend will need to be adjusted
  // Actually, for file upload we need multipart/form-data
  const response = await fetch('/api/content/skills', {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    throw new Error(`Failed to create skill: ${response.status}`)
  }
  return response.json()
}
