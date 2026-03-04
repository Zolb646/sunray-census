import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Wallet,
  BarChart2,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatCents, startOfDay, startOfMonth } from '@/lib/utils'
import { KpiCard } from '@/components/admin/kpi-card'
import { SalesChart } from '@/components/admin/sales-chart'

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
      select: { costPrice: true, sellingPrice: true, stockQty: true, lowStockThreshold: true },
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

  // Group sales by date for chart
  const salesByDate: Record<string, number> = {}
  recentSales.forEach((sale) => {
    const date = sale.createdAt.toISOString().slice(0, 10)
    salesByDate[date] = (salesByDate[date] ?? 0) + sale.total
  })
  const chartData = Object.entries(salesByDate)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const monthProfit =
    (monthSales._sum.total ?? 0) - (monthExpenses._sum.amount ?? 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Өнөөдрийн орлого"
          value={formatCents(todaySales._sum.total ?? 0)}
          subtitle="Өнөөдөр дууссан борлуулалт"
          icon={DollarSign}
        />
        <KpiCard
          title="Сарын орлого"
          value={formatCents(monthSales._sum.total ?? 0)}
          subtitle="Энэ сарын нийт"
          icon={TrendingUp}
        />
        <KpiCard
          title="Сарын зардал"
          value={formatCents(monthExpenses._sum.amount ?? 0)}
          subtitle="Энэ сарын нийт"
          icon={Wallet}
        />
        <KpiCard
          title="Цэвэр ашиг"
          value={formatCents(monthProfit)}
          subtitle="Орлогоос зардал хассан"
          icon={BarChart2}
          className={monthProfit < 0 ? 'border-destructive' : ''}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Нийт бараа"
          value={totalItems.toString()}
          subtitle="Идэвхтэй хувцасны бараа"
          icon={Package}
        />
        <KpiCard
          title="Нөөцийн үнэ цэнэ"
          value={formatCents(inventoryValue)}
          subtitle="Бүх нөөцийн өртөг"
          icon={ShoppingCart}
        />
        <KpiCard
          title="Дуусах дөхсөн бараа"
          value={lowStockCount.toString()}
          subtitle="Босго түвшинтэй тэнцүү эсвэл доош"
          icon={AlertTriangle}
          className={lowStockCount > 0 ? 'border-orange-400' : ''}
        />
      </div>

      <SalesChart data={chartData} />
    </div>
  )
}
