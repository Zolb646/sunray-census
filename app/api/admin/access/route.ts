import { NextResponse } from 'next/server'
import { getAdminAccessState } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const access = await getAdminAccessState()

  return NextResponse.json(
    {
      authenticated: access.authenticated,
      isAdmin: access.isAdmin,
      redirectTo: access.redirectTo,
      userId: access.userId,
      admin: access.admin,
    },
    {
      status: access.isAdmin ? 200 : access.authenticated ? 403 : 401,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
