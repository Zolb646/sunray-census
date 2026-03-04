'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
    const d = new Date(date)
    const sunday = new Date(d)
    sunday.setDate(d.getDate() - d.getDay())
    const key = sunday.toISOString().slice(0, 10)
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Борлуулалтын тойм</CardTitle>
        <div className="flex gap-1">
          {(['daily', 'weekly', 'monthly'] as View[]).map((v) => (
            <Button
              key={v}
              variant={view === v ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView(v)}
            >
              {VIEW_LABELS[v]}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) => `$${(v / 100).toFixed(0)}`}
            />
            <Tooltip
              formatter={(value) => [
                formatCents(Number(value ?? 0)),
                'Борлуулалт',
              ]}
              labelFormatter={(label) => `Огноо: ${String(label ?? '')}`}
            />
            <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
