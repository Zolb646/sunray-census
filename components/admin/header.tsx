'use client'

import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const pageTitles: Record<string, string> = {
  '/admin': 'Хянах самбар',
  '/admin/inventory': 'Бараа',
  '/admin/sales': 'Борлуулалт',
  '/admin/expenses': 'Зардал',
  '/admin/reports': 'Тайлан',
}

export function Header() {
  const pathname = usePathname()
  const title = pageTitles[pathname] ?? 'Удирдлага'

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
      <h1 className="font-semibold text-lg">{title}</h1>
      <UserButton />
    </header>
  )
}
