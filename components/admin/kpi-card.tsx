import { type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  className?: string
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn('panel-surface gap-0 border-white/70 py-0', className)}>
      <CardHeader className='pb-3 pt-5'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <div className='text-[11px] uppercase tracking-[0.24em] text-muted-foreground'>
              Snapshot
            </div>
            <CardTitle className='mt-2 text-sm font-medium text-muted-foreground'>
              {title}
            </CardTitle>
          </div>
          <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
            <Icon className='h-5 w-5' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='pb-5'>
        <div className='text-3xl font-semibold tracking-tight text-foreground'>
          {value}
        </div>
        {subtitle ? (
          <p className='mt-2 text-sm leading-6 text-muted-foreground'>{subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
