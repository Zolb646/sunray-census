'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const adminNavItems = [
  { href: '/admin', label: 'Хянах самбар', icon: LayoutDashboard },
  { href: '/admin/inventory', label: 'Бараа', icon: Package },
  { href: '/admin/sales', label: 'Борлуулалт', icon: ShoppingCart },
  { href: '/admin/expenses', label: 'Зардал', icon: Receipt },
  { href: '/admin/reports', label: 'Тайлан', icon: BarChart3 },
]

interface SidebarNavProps {
  className?: string
  onNavigate?: () => void
}

export function SidebarNav({ className, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn('space-y-2', className)}>
      {adminNavItems.map((item) => {
        const isActive =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition-all',
              isActive
                ? 'bg-white text-slate-900 shadow-[0_18px_35px_-20px_rgba(15,23,42,0.65)]'
                : 'text-sidebar-foreground/72 hover:bg-white/10 hover:text-sidebar-foreground'
            )}
          >
            <span className='flex items-center gap-3'>
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors',
                  isActive
                    ? 'border-slate-200 bg-slate-100 text-slate-900'
                    : 'border-white/12 bg-white/6 text-sidebar-foreground/70 group-hover:border-white/20 group-hover:text-sidebar-foreground'
                )}
              >
                <item.icon className='h-4 w-4' />
              </span>
              <span className='font-medium'>{item.label}</span>
            </span>
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-all',
                isActive ? 'bg-amber-400' : 'bg-transparent group-hover:bg-white/25'
              )}
            />
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  return (
    <aside className='hidden lg:sticky lg:top-4 lg:flex lg:h-[calc(100vh-2rem)] lg:w-72 lg:flex-col lg:self-start lg:px-4 lg:py-4'>
      <div className='flex h-full flex-col rounded-[30px] border border-sidebar-border bg-sidebar px-4 py-5 text-sidebar-foreground shadow-[0_30px_80px_-38px_rgba(15,23,42,0.8)]'>
        <Link
          href='/admin'
          className='flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3'
        >
          <span className='flex h-12 w-12 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground'>
            <Sparkles className='h-5 w-5' />
          </span>
          <div>
            <div className='text-xs uppercase tracking-[0.28em] text-sidebar-foreground/50'>
              Sunray
            </div>
            <div className='text-lg font-semibold tracking-tight'>Admin Console</div>
          </div>
        </Link>

        <div className='mt-6 flex-1 overflow-hidden'>
          <SidebarNav />
        </div>

        <div className='rounded-[24px] border border-white/10 bg-white/8 p-4'>
          <div className='text-xs uppercase tracking-[0.24em] text-sidebar-foreground/45'>
            Daily focus
          </div>
          <p className='mt-3 text-sm leading-6 text-sidebar-foreground/80'>
            Track inventory, register sales, and keep expense reporting current from one place.
          </p>
        </div>
      </div>
    </aside>
  )
}


