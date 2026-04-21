import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NoAccessPanelPage() {
  return (
    <main className='flex min-h-screen items-center justify-center px-6 py-12'>
      <section className='workspace-hero w-full max-w-3xl rounded-[36px] p-8 sm:p-10'>
        <div className='flex size-16 items-center justify-center rounded-[24px] bg-destructive/10 text-destructive'>
          <ShieldX className='size-8' />
        </div>

        <div className='mt-6 space-y-3'>
          <div className='section-kicker'>Хандалтын эрх</div>
          <h1 className='display-title text-4xl font-semibold tracking-tight'>
            Самбарт нэвтрэх эрх алга
          </h1>
          <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
            Та нэвтэрсэн байна. Гэхдээ энэ бүртгэл Sunray самбарын админ эрхтэй
            хэрэглэгчээр бүртгэгдээгүй байна.
          </p>
          <p className='max-w-2xl text-sm leading-6 text-muted-foreground'>
            Одоогийн админаас таны Clerk хэрэглэгчийн ID-г `Admin` хүснэгтэд нэмүүлэх
            эсвэл эрхтэй өөр бүртгэлээр нэвтэрнэ үү.
          </p>
        </div>

        <div className='mt-8 flex flex-wrap gap-3'>
          <Button asChild className='rounded-full px-5'>
            <Link href='/admin'>Дахин шалгах</Link>
          </Button>
          <Button asChild variant='outline' className='rounded-full px-5'>
            <Link href='/sign-in'>Өөр бүртгэл ашиглах</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
