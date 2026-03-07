import {
  AlertTriangle,
  BarChart2,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { SalesChart } from '@/components/admin/sales-chart'
import { KpiCard } from '@/components/admin/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { formatCents, startOfDay, startOfMonth } from '@/lib/utils'

export default async function DashboardPage() {
  const now = new Date()
  const todayStart = startOfDay(now)
  const monthStart = startOfMonth(now)
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const [
    totalItems,
    allItems,
    todaySales,
    monthSales,
    monthExpenses,
    recentSales,
  ] = await Promise.all([
    prisma.clothingItem.count(),
    prisma.clothingItem.findMany({
      select: {
        costPrice: true,
        sellingPrice: true,
        stockQty: true,
        lowStockThreshold: true,
      },
    }),
    prisma.sale.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: todayStart } },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.sale.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const inventoryValue = allItems.reduce(
    (sum, item) => sum + item.costPrice * item.stockQty,
    0
  )
  const lowStockCount = allItems.filter(
    (item) => item.stockQty <= item.lowStockThreshold
  ).length

  const salesByDate: Record<string, number> = {}
  recentSales.forEach((sale) => {
    const date = sale.createdAt.toISOString().slice(0, 10)
    salesByDate[date] = (salesByDate[date] ?? 0) + sale.total
  })

  const chartData = Object.entries(salesByDate)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const monthRevenue = monthSales._sum.total ?? 0
  const monthExpenseTotal = monthExpenses._sum.amount ?? 0
  const monthProfit = monthRevenue - monthExpenseTotal

  return (
    <div className='space-y-6'>
      <section className='grid gap-4 xl:grid-cols-[1.5fr_1fr]'>
        <Card className='panel-surface gap-0 border-white/70 py-0'>
          <CardHeader className='pb-4 pt-6'>
            <div className='text-[11px] uppercase tracking-[0.28em] text-muted-foreground'>
              Performance snapshot
            </div>
            <CardTitle className='mt-2 text-3xl font-semibold tracking-tight'>
              Keep the floor, stockroom, and cash flow aligned.
            </CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4 pb-6 md:grid-cols-3'>
            <div className='metric-tile rounded-[24px] p-4'>
              <div className='text-sm text-muted-foreground'>Month revenue</div>
              <div className='mt-2 text-2xl font-semibold'>{formatCents(monthRevenue)}</div>
            </div>
            <div className='metric-tile rounded-[24px] p-4'>
              <div className='text-sm text-muted-foreground'>Month expenses</div>
              <div className='mt-2 text-2xl font-semibold'>{formatCents(monthExpenseTotal)}</div>
            </div>
            <div className='metric-tile rounded-[24px] p-4'>
              <div className='text-sm text-muted-foreground'>Net result</div>
              <div className='mt-2 text-2xl font-semibold'>{formatCents(monthProfit)}</div>
            </div>
          </CardContent>
        </Card>

        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-1'>
          <Card className='panel-surface gap-0 border-white/70 py-0'>
            <CardHeader className='pb-2 pt-5'>
              <CardTitle className='text-base'>Inventory value</CardTitle>
            </CardHeader>
            <CardContent className='pb-5'>
              <div className='text-3xl font-semibold tracking-tight'>
                {formatCents(inventoryValue)}
              </div>
              <p className='mt-2 text-sm text-muted-foreground'>
                Cost basis across all active stock.
              </p>
            </CardContent>
          </Card>

          <Card className='panel-surface gap-0 border-white/70 py-0'>
            <CardHeader className='pb-2 pt-5'>
              <CardTitle className='text-base'>Stock attention</CardTitle>
            </CardHeader>
            <CardContent className='pb-5'>
              <div className='flex items-center gap-3'>
                <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700'>
                  <AlertTriangle className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-3xl font-semibold tracking-tight'>
                    {lowStockCount}
                  </div>
                  <div className='text-sm text-muted-foreground'>items at or below threshold</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <KpiCard
          title='Өнөөдрийн орлого'
          value={formatCents(todaySales._sum.total ?? 0)}
          subtitle='Completed sales recorded today.'
          icon={DollarSign}
        />
        <KpiCard
          title='Сарын орлого'
          value={formatCents(monthRevenue)}
          subtitle='Running total for the current month.'
          icon={TrendingUp}
        />
        <KpiCard
          title='Сарын зардал'
          value={formatCents(monthExpenseTotal)}
          subtitle='Operating costs booked this month.'
          icon={Wallet}
        />
        <KpiCard
          title='Цэвэр ашиг'
          value={formatCents(monthProfit)}
          subtitle='Revenue minus recorded expenses.'
          icon={BarChart2}
          className={monthProfit < 0 ? 'border-red-200' : ''}
        />
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <KpiCard
          title='Нийт бараа'
          value={totalItems.toString()}
          subtitle='Active products in the catalog.'
          icon={Package}
        />
        <KpiCard
          title='Нөөцийн үнэ цэнэ'
          value={formatCents(inventoryValue)}
          subtitle='Total inventory value at cost.'
          icon={ShoppingCart}
        />
        <KpiCard
          title='Дуусах дөхсөн бараа'
          value={lowStockCount.toString()}
          subtitle='Items that need replenishment soon.'
          icon={AlertTriangle}
          className={lowStockCount > 0 ? 'border-amber-200' : ''}
        />
      </div>

      <SalesChart data={chartData} />
    </div>
  )
}
