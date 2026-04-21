import { Role } from '@prisma/client'

export interface SessionUser {
  id: string
  email: string
  name?: string | null
  role: Role
}
