import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className='relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,221,180,0.4),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(214,146,111,0.18),transparent_24%)]' />
      <section className='workspace-hero relative w-full max-w-5xl rounded-[36px] px-6 py-8 sm:px-10 sm:py-10'>
        <div className='grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center'>
          <div className='max-w-2xl space-y-4'>
            <div className='section-kicker'>Sunray нэвтрэх хэсэг</div>
            <h1 className='display-title text-4xl font-semibold tracking-tight sm:text-5xl'>
              Нэвтрэх
            </h1>
            <p className='max-w-xl text-sm leading-6 text-muted-foreground sm:text-base'>
              Sunray удирдлагын самбарт нэвтэрч, борлуулалт, нөөц, зардлын ажлын
              урсгалаа нэг орчноос хянаарай.
            </p>
          </div>
          <div className='panel-surface rounded-[32px] p-4 sm:p-6'>
            <SignIn />
          </div>
        </div>
      </section>
    </main>
  )
}
