'use client'

import { UserButton } from '@clerk/nextjs'
import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SidebarNav } from '@/components/admin/sidebar'

const pageMeta: Record<string, { title: string; description: string }> = {
  '/admin': {
    title: 'Хянах самбар',
    description: 'Орлого, нөөцийн төлөв, сарын үзүүлэлтийг нэг дороос хяална.',
  },
  '/admin/inventory': {
    title: 'Бараа',
    description: 'Каталог, нөөцийн тоо, дахин захиалах босгыг шинэчилнэ.',
  },
  '/admin/sales': {
    title: 'Борлуулалт',
    description: 'Борлуулалтыг хурдан бүртгэж, баталгаажсан захиалгуудыг удирдана.',
  },
  '/admin/expenses': {
    title: 'Зардал',
    description: 'Үйл ажиллагааны зардлыг хянаж, бүртгэлийг шинэ байлгана.',
  },
  '/admin/reports': {
    title: 'Тайлан',
    description: 'Ашиг, нөөцийн үнэ цэнэ, татаж авах тайлангуудыг харах хэсэг.',
  },
}

export function Header() {
  const pathname = usePathname()
  const meta = pageMeta[pathname] ?? {
    title: 'Удирдлага',
    description: 'Sunray удирдлагын ажлын орчин.',
  }

  return (
    <header className='sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8'>
      <div className='toolbar-surface flex items-center justify-between gap-4 rounded-[30px] px-4 py-4 backdrop-blur-xl sm:px-6'>
        <div className='flex min-w-0 items-start gap-3'>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                className='h-11 w-11 rounded-2xl border-white/70 bg-white/70 lg:hidden'
              >
                <Menu className='h-5 w-5' />
                <span className='sr-only'>Цэс нээх</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side='left'
              className='w-[22rem] border-white/20 bg-sidebar p-0 text-sidebar-foreground'
            >
              <SheetHeader className='border-b border-white/10 px-5 py-5 text-left'>
                <SheetTitle className='text-sidebar-foreground'>Sunray удирдлага</SheetTitle>
              </SheetHeader>
              <div className='p-4'>
                <SidebarNav />
              </div>
            </SheetContent>
          </Sheet>

          <div className='min-w-0'>
            <div className='section-kicker'>Sunray үйл ажиллагаа</div>
            <h1 className='display-title truncate pt-1 text-[1.65rem] leading-none font-semibold text-foreground sm:text-[2rem]'>
              {meta.title}
            </h1>
            <p className='mt-1 hidden text-sm text-muted-foreground sm:block'>
              {meta.description}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <div className='hidden rounded-full border border-white/70 bg-white/60 px-3 py-1 text-xs text-muted-foreground md:block'>
            Идэвхтэй ажлын орчин
          </div>
          <div className='rounded-full border border-white/70 bg-white/70 p-1'>
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  )
}
