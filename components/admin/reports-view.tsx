'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { type DateRange } from 'react-day-picker'
import { getReportData } from '@/app/admin/reports/actions'
import {
  getExpenseCategoryLabel,
  getInventoryCategoryLabel,
} from '@/lib/localization'
import { formatCents, formatDate } from '@/lib/utils'
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
  const now = new Date()
  const initialRange: DateRange = {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: now,
  }

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialRange
  )
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLoad() {
    const fromDate = dateRange?.from
    const toDate = dateRange?.to ?? dateRange?.from

    if (!fromDate || !toDate) return

    setLoading(true)
    setError('')
    try {
      const result = await getReportData(
        fromDate,
        new Date(
          toDate.getFullYear(),
          toDate.getMonth(),
          toDate.getDate(),
          23,
          59,
          59
        )
      )
      setData(result)
    } catch (e) {
      setError('Тайлангийн мэдээлэл ачаалж чадсангүй')
      console.error(e)
    } finally {
      setLoading(false)
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <Button onClick={handleLoad} disabled={loading}>
          {loading ? 'Ачаалж байна...' : 'Тайлан гаргах'}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-lg" />
          ))}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Нийт орлого
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCents(data.totalRevenue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.salesCount} дууссан борлуулалт
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Нийт зардал
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  {formatCents(data.totalExpenses)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Цэвэр ашиг
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}
                >
                  {formatCents(data.netProfit)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Шилдэг 5 бараа</CardTitle>
                <Button size="sm" variant="outline" onClick={exportSalesCsv}>
                  CSV татах
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data.topItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Энэ хугацаанд борлуулалт алга
                </p>
              ) : (
                <div className="space-y-2">
                  {data.topItems.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-sm text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium">{item.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {getInventoryCategoryLabel(item.category)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {item.qty} ширхэг
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCents(item.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Нөөцийн төлөв</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportInventoryCsv}
                >
                  CSV татах
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {data.inventoryItems.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex items-center justify-between border-b py-1 text-sm last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.isLowStock && (
                        <Badge variant="destructive" className="text-xs">
                          Бага
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-muted-foreground">
                      <span>Тоо: {item.stockQty}</span>
                      <span>Өртөг: {formatCents(item.costValue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={exportExpensesCsv}>
              Зардлын CSV татах
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
