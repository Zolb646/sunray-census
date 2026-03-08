import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NoAccessPanelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <section className="w-full max-w-xl rounded-3xl border bg-card p-8 shadow-sm">
        <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldX className="size-7" />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">
          Самбарт нэвтрэх эрх алга
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Та нэвтэрсэн байна, гэхдээ энэ бүртгэл Sunray самбарын админ
          эрхтэйгээр бүртгэгдээгүй байна.
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Одоо байгаа админаас таны Clerk хэрэглэгчийн ID-г `Admin` хүснэгтэд
          нэмүүлэх эсвэл эрхтэй өөр бүртгэлээр нэвтэрнэ үү.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin">Дахин шалгах</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sign-in">Өөр бүртгэл ашиглах</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
