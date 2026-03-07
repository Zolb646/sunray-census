'use client'

import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCents } from '@/lib/utils'

interface SalesDataPoint {
  date: string
  total: number
}

interface SalesChartProps {
  data: SalesDataPoint[]
}

type View = 'daily' | 'weekly' | 'monthly'

const VIEW_LABELS: Record<View, string> = {
  daily: 'Өдөр',
  weekly: '7 хоног',
  monthly: 'Сар',
}

function aggregateWeekly(data: SalesDataPoint[]): SalesDataPoint[] {
  const weeks: Record<string, number> = {}

  data.forEach(({ date, total }) => {
    const currentDate = new Date(date)
    const weekStart = new Date(currentDate)
    weekStart.setDate(currentDate.getDate() - currentDate.getDay())

    const key = weekStart.toISOString().slice(0, 10)
    weeks[key] = (weeks[key] ?? 0) + total
  })

  return Object.entries(weeks)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function aggregateMonthly(data: SalesDataPoint[]): SalesDataPoint[] {
  const months: Record<string, number> = {}

  data.forEach(({ date, total }) => {
    const key = date.slice(0, 7)
    months[key] = (months[key] ?? 0) + total
  })

  return Object.entries(months)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function SalesChart({ data }: SalesChartProps) {
  const [view, setView] = useState<View>('daily')

  const chartData =
    view === 'daily'
      ? data
      : view === 'weekly'
        ? aggregateWeekly(data)
        : aggregateMonthly(data)

  return (
    <Card className='panel-surface gap-0 border-white/70 py-0'>
      <CardHeader className='flex flex-col gap-4 pb-4 pt-6 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='text-[11px] uppercase tracking-[0.28em] text-muted-foreground'>
            Trendline
          </div>
          <CardTitle className='mt-2 text-xl font-semibold tracking-tight'>
            Борлуулалтын тойм
          </CardTitle>
          <p className='mt-1 text-sm text-muted-foreground'>
            Compare short-term movement and broader revenue momentum.
          </p>
        </div>

        <div className='flex flex-wrap gap-2'>
          {(['daily', 'weekly', 'monthly'] as View[]).map((value) => (
            <Button
              key={value}
              size='sm'
              variant={view === value ? 'default' : 'outline'}
              className='rounded-full'
              onClick={() => setView(value)}
            >
              {VIEW_LABELS[value]}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className='pb-6'>
        {chartData.length === 0 ? (
          <div className='flex h-[320px] items-center justify-center rounded-[24px] border border-dashed border-border bg-white/55 text-sm text-muted-foreground'>
            No completed sales in the selected window yet.
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={320}>
            <BarChart data={chartData} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke='oklch(0.89 0.013 84.1)' vertical={false} />
              <XAxis
                dataKey='date'
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'oklch(0.54 0.02 36.6)' }}
                tickFormatter={(value: string) => value.slice(5)}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'oklch(0.54 0.02 36.6)' }}
                tickFormatter={(value: number) => new Intl.NumberFormat('mn-MN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(111, 78, 55, 0.06)' }}
                contentStyle={{
                  borderRadius: 18,
                  border: '1px solid rgba(255,255,255,0.7)',
                  background: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 20px 40px -24px rgba(15,23,42,0.35)',
                }}
                formatter={(value) => [formatCents(Number(value ?? 0)), 'Борлуулалт']}
                labelFormatter={(label) => `Огноо: ${String(label ?? '')}`}
              />
              <Bar dataKey='total' fill='var(--color-chart-1)' radius={[16, 16, 6, 6]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

