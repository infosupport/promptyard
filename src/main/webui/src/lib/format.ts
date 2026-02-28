export function getInitials(name: string): string {
  const parts = name.split(' ').filter((part) => part.length > 0)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function formatMemberSince(isoDate: string): string {
  const date = new Date(isoDate)
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const year = date.getFullYear()
  return `Member since ${month} ${year}`
}
