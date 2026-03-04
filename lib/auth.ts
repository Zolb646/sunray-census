import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { prisma } from './prisma'

type AdminAccessErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN'

class AdminAccessError extends Error {
  constructor(readonly code: AdminAccessErrorCode) {
    super(code === 'UNAUTHORIZED' ? 'Unauthorized' : 'Forbidden')
    this.name = 'AdminAccessError'
  }
}

export const getAdminAccessState = cache(async () => {
  const { userId } = await auth()

  if (!userId) {
    return {
      authenticated: false,
      isAdmin: false,
      redirectTo: '/sign-in' as const,
      userId: null,
      admin: null,
    }
  }

  const admin = await prisma.admin.findUnique({ where: { userId } })

  if (!admin) {
    return {
      authenticated: true,
      isAdmin: false,
      redirectTo: '/noaccespanel' as const,
      userId,
      admin: null,
    }
  }

  return {
    authenticated: true,
    isAdmin: true,
    redirectTo: null,
    userId,
    admin,
  }
})

export async function assertAdmin() {
  const access = await getAdminAccessState()

  if (!access.authenticated) {
    throw new AdminAccessError('UNAUTHORIZED')
  }

  if (!access.admin) {
    throw new AdminAccessError('FORBIDDEN')
  }

  return access.admin
}

export async function requireAdminPageAccess() {
  const access = await getAdminAccessState()

  if (!access.isAdmin) {
    redirect(access.redirectTo ?? '/sign-in')
  }

  return access.admin
}
