'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { type DateRange } from 'react-day-picker'
import { getReportData } from '@/app/admin/reports/actions'
import {
  getExpenseCategoryLabel,
  getInventoryCategoryLabel,
} from '@/lib/localization'
import { endOfDay, formatCents, formatDate, startOfMonth } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Skeleton } from '@/components/ui/skeleton'

type ReportData = Awaited<ReturnType<typeof getReportData>>

function downloadCsv(filename: string, data: object[]) {
  const csv = `\uFEFF${Papa.unparse(data)}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ReportsView() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date()
    return {
      from: startOfMonth(now),
      to: now,
    }
  })
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadReport(fromDate: Date, toDate: Date) {
    setLoading(true)
    setError('')

    try {
      const result = await getReportData(fromDate, endOfDay(toDate))
      setData(result)
    } catch (caughtError) {
      setError('Тайлангийн мэдээлэл ачаалж чадсангүй')
      console.error(caughtError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const now = new Date()
    void loadReport(startOfMonth(now), now)
  }, [])

  async function handleLoad() {
    const fromDate = dateRange?.from
    const toDate = dateRange?.to ?? dateRange?.from

    if (!fromDate || !toDate) return
    await loadReport(fromDate, toDate)
  }

  function exportSalesCsv() {
    if (!data) return

    downloadCsv(
      'борлуулалтын-тайлан.csv',
      data.topItems.map((item) => ({
        Бараа: item.name,
        Ангилал: getInventoryCategoryLabel(item.category),
        'Зарагдсан тоо': item.qty,
        Орлого: formatCents(item.revenue),
      }))
    )
  }

  function exportExpensesCsv() {
    if (!data) return

    downloadCsv(
      'зардлын-тайлан.csv',
      data.expenseDetails.map((expense) => ({
        Огноо: formatDate(new Date(expense.date)),
        Ангилал: getExpenseCategoryLabel(expense.category),
        Тайлбар: expense.description,
        Дүн: formatCents(expense.amount),
      }))
    )
  }

  function exportInventoryCsv() {
    if (!data) return

    downloadCsv(
      'нөөцийн-тайлан.csv',
      data.inventoryItems.map((item) => ({
        Бараа: item.name,
        Ангилал: getInventoryCategoryLabel(item.category),
        Нөөц: item.stockQty,
        'Өртгийн дүн': formatCents(item.costValue),
        'Зарах үнийн дүн': formatCents(item.sellValue),
        'Бага нөөц': item.isLowStock ? 'Тийм' : 'Үгүй',
      }))
    )
  }

  const selectedFrom = dateRange?.from
  const selectedTo = dateRange?.to ?? dateRange?.from
  const rangeLabel = selectedFrom && selectedTo
    ? `${formatDate(selectedFrom)} - ${formatDate(selectedTo)}`
    : 'Current month'

  const expenseByCategory = data
    ? Object.entries(
        data.expenseDetails.reduce<Record<string, number>>((accumulator, expense) => {
          accumulator[expense.category] =
            (accumulator[expense.category] ?? 0) + expense.amount
          return accumulator
        }, {})
      ).sort(([, left], [, right]) => right - left)
    : []

  return (
    <div className='space-y-6'>
      <section className='panel-surface rounded-[30px] p-5 sm:p-6'>
        <div className='flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between'>
          <div>
            <div className='text-[11px] uppercase tracking-[0.28em] text-muted-foreground'>
              Reporting suite
            </div>
            <h2 className='mt-2 text-3xl font-semibold tracking-tight'>
              Generate clean performance snapshots and exports.
            </h2>
            <p className='mt-2 max-w-2xl text-sm leading-6 text-muted-foreground'>
              Use a custom date range, review the core numbers, and export sales, expenses, or inventory summaries in one pass.
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-3'>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button className='rounded-full' onClick={handleLoad} disabled={loading || !dateRange?.from}>
              {loading ? 'Ачаалж байна...' : 'Тайлан гаргах'}
            </Button>
          </div>
        </div>
      </section>

      {error ? <p className='text-sm text-destructive'>{error}</p> : null}

      {loading ? (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className='h-32 rounded-[28px]' />
          ))}
        </div>
      ) : null}

      {data ? (
        <div className='space-y-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <div className='metric-tile rounded-[28px] p-5'>
              <div className='text-sm text-muted-foreground'>Range</div>
              <div className='mt-2 text-lg font-semibold'>{rangeLabel}</div>
            </div>
            <div className='metric-tile rounded-[28px] p-5'>
              <div className='text-sm text-muted-foreground'>Total revenue</div>
              <div className='mt-2 text-3xl font-semibold text-green-700'>
                {formatCents(data.totalRevenue)}
              </div>
            </div>
            <div className='metric-tile rounded-[28px] p-5'>
              <div className='text-sm text-muted-foreground'>Total expenses</div>
              <div className='mt-2 text-3xl font-semibold text-rose-600'>
                {formatCents(data.totalExpenses)}
              </div>
            </div>
            <div className='metric-tile rounded-[28px] p-5'>
              <div className='text-sm text-muted-foreground'>Net profit</div>
              <div
                className={`mt-2 text-3xl font-semibold ${
                  data.netProfit >= 0 ? 'text-green-700' : 'text-rose-600'
                }`}
              >
                {formatCents(data.netProfit)}
              </div>
            </div>
          </div>

          <div className='grid gap-4 xl:grid-cols-[1.4fr_1fr]'>
            <Card className='panel-surface gap-0 border-white/70 py-0'>
              <CardHeader className='flex flex-col gap-3 border-b border-border/70 pb-4 pt-5 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <CardTitle className='text-xl font-semibold tracking-tight'>
                    Шилдэг 5 бараа
                  </CardTitle>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {data.salesCount} completed sales included in this report.
                  </p>
                </div>
                <Button size='sm' variant='outline' className='rounded-full' onClick={exportSalesCsv}>
                  CSV татах
                </Button>
              </CardHeader>
              <CardContent className='space-y-3 pb-6 pt-5'>
                {data.topItems.length === 0 ? (
                  <div className='rounded-[24px] border border-dashed border-border p-6 text-sm text-muted-foreground'>
                    Энэ хугацаанд борлуулалт алга
                  </div>
                ) : (
                  data.topItems.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className='metric-tile flex items-center justify-between rounded-[24px] p-4'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
                          #{index + 1}
                        </div>
                        <div>
                          <div className='font-medium'>{item.name}</div>
                          <div className='mt-1'>
                            <Badge variant='secondary'>
                              {getInventoryCategoryLabel(item.category)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='font-medium'>{item.qty} ширхэг</div>
                        <div className='text-sm text-muted-foreground'>
                          {formatCents(item.revenue)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className='panel-surface gap-0 border-white/70 py-0'>
              <CardHeader className='border-b border-border/70 pb-4 pt-5'>
                <CardTitle className='text-xl font-semibold tracking-tight'>
                  Export center
                </CardTitle>
                <p className='text-sm text-muted-foreground'>
                  Download ready-to-share CSV files for finance and stock review.
                </p>
              </CardHeader>
              <CardContent className='grid gap-3 pb-6 pt-5'>
                <Button variant='outline' className='justify-between rounded-2xl px-4 py-6' onClick={exportSalesCsv}>
                  <span>Sales summary CSV</span>
                  <span className='text-xs text-muted-foreground'>Top items</span>
                </Button>
                <Button variant='outline' className='justify-between rounded-2xl px-4 py-6' onClick={exportExpensesCsv}>
                  <span>Expense CSV</span>
                  <span className='text-xs text-muted-foreground'>Ledger lines</span>
                </Button>
                <Button variant='outline' className='justify-between rounded-2xl px-4 py-6' onClick={exportInventoryCsv}>
                  <span>Inventory CSV</span>
                  <span className='text-xs text-muted-foreground'>Stock values</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-4 xl:grid-cols-[1.2fr_0.8fr]'>
            <Card className='panel-surface gap-0 border-white/70 py-0'>
              <CardHeader className='flex flex-col gap-3 border-b border-border/70 pb-4 pt-5 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <CardTitle className='text-xl font-semibold tracking-tight'>
                    Нөөцийн төлөв
                  </CardTitle>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    Current stock value and low-stock flags across the catalog.
                  </p>
                </div>
                <Button size='sm' variant='outline' className='rounded-full' onClick={exportInventoryCsv}>
                  CSV татах
                </Button>
              </CardHeader>
              <CardContent className='space-y-3 pb-6 pt-5'>
                <div className='max-h-[420px] space-y-3 overflow-y-auto pr-1'>
                  {data.inventoryItems.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className='metric-tile rounded-[24px] p-4'
                    >
                      <div className='flex items-center justify-between gap-4'>
                        <div>
                          <div className='font-medium'>{item.name}</div>
                          <div className='mt-1 text-sm text-muted-foreground'>
                            {getInventoryCategoryLabel(item.category)}
                          </div>
                        </div>
                        {item.isLowStock ? (
                          <Badge variant='destructive'>Бага</Badge>
                        ) : (
                          <Badge variant='secondary'>OK</Badge>
                        )}
                      </div>
                      <div className='mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground'>
                        <span>Тоо: {item.stockQty}</span>
                        <span>Өртөг: {formatCents(item.costValue)}</span>
                        <span>Зарах үнэ: {formatCents(item.sellValue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className='panel-surface gap-0 border-white/70 py-0'>
              <CardHeader className='border-b border-border/70 pb-4 pt-5'>
                <CardTitle className='text-xl font-semibold tracking-tight'>
                  Expense mix
                </CardTitle>
                <p className='text-sm text-muted-foreground'>
                  Ranked by total amount in the selected range.
                </p>
              </CardHeader>
              <CardContent className='space-y-3 pb-6 pt-5'>
                {expenseByCategory.length === 0 ? (
                  <div className='rounded-[24px] border border-dashed border-border p-6 text-sm text-muted-foreground'>
                    No expense entries in this range.
                  </div>
                ) : (
                  expenseByCategory.map(([category, amount]) => (
                    <div key={category} className='metric-tile rounded-[24px] p-4'>
                      <div className='flex items-center justify-between gap-4'>
                        <div className='font-medium'>
                          {getExpenseCategoryLabel(category)}
                        </div>
                        <div className='text-right font-semibold'>
                          {formatCents(amount)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <Button size='sm' variant='outline' className='w-full rounded-full' onClick={exportExpensesCsv}>
                  Зардлын CSV татах
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}
