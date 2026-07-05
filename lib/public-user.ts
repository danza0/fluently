// Safe subset of User fields to return from API routes.
// Never return full User records — they include the password hash.
export const publicUserSelect = {
  id: true,
  name: true,
  nickname: true,
  email: true,
  avatar: true,
} as const
