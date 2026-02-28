export interface UserProfile {
  id: number | null
  slug: string
  fullName: string
  emailAddress: string
  businessUnit: string | null
  jobTitle: string | null
  privacyAcceptedAt: string | null
  createdAt: string
  modifiedAt: string | null
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const response = await fetch('/api/profiles/me')
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.status}`)
  }
  return response.json()
}

export interface CreateProfileRequest {
  jobTitle?: string | null
  businessUnit?: string | null
  privacyAccepted: boolean
}

export interface CreateProfileResponse {
  slug: string
}

export async function createProfile(
  request: CreateProfileRequest,
): Promise<CreateProfileResponse> {
  const response = await fetch('/api/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error(`Failed to create profile: ${response.status}`)
  }
  return response.json()
}

export interface MyContentItemResponse {
  slug: string
  title: string
  description: string
  tags: string[]
  contentType: string
  authorName: string
  createdAt: string
  modifiedAt: string | null
}

export interface MyContentPageResponse {
  items: MyContentItemResponse[]
  pageIndex: number
  totalPages: number
}

export async function getMyContent(page: number = 0): Promise<MyContentPageResponse> {
  const response = await fetch(`/api/profiles/me/content?page=${page}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch my content: ${response.status}`)
  }
  return response.json()
}

export async function getProfileBySlug(slug: string): Promise<UserProfile> {
  const response = await fetch(`/api/profiles/${encodeURIComponent(slug)}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch profile: ${response.status}`)
  }
  return response.json()
}

export interface UpdateProfileRequest {
  jobTitle: string | null
  businessUnit: string | null
}

export async function updateProfile(request: UpdateProfileRequest): Promise<void> {
  const response = await fetch('/api/profiles/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.status}`)
  }
}

export async function getProfileContent(
  slug: string,
  page: number = 0,
): Promise<MyContentPageResponse> {
  const response = await fetch(
    `/api/profiles/${encodeURIComponent(slug)}/content?page=${page}`,
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch profile content: ${response.status}`)
  }
  return response.json()
}
