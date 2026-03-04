import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Нэвтрэх</h1>
          <p className="text-sm text-muted-foreground">
            Sunray удирдлагын самбарт нэвтрэх хэсэг
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  )
}
