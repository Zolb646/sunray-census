import {
  AlertTriangle,
  BarChart2,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { SalesChart } from "@/components/admin/sales-chart";
import { KpiCard } from "@/components/admin/kpi-card";
import { prisma } from "@/lib/prisma";
import { formatCents, startOfDay, startOfMonth } from "@/lib/utils";

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

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
      where: { status: "COMPLETED", createdAt: { gte: todayStart } },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.sale.findMany({
      where: { status: "COMPLETED", createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const inventoryValue = allItems.reduce(
    (sum, item) => sum + item.costPrice * item.stockQty,
    0,
  );
  const lowStockCount = allItems.filter(
    (item) => item.stockQty <= item.lowStockThreshold,
  ).length;

  const salesByDate: Record<string, number> = {};
  recentSales.forEach((sale) => {
    const date = sale.createdAt.toISOString().slice(0, 10);
    salesByDate[date] = (salesByDate[date] ?? 0) + sale.total;
  });

  const chartData = Object.entries(salesByDate)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthRevenue = monthSales._sum.total ?? 0;
  const monthExpenseTotal = monthExpenses._sum.amount ?? 0;
  const monthProfit = monthRevenue - monthExpenseTotal;
  return (
    <div className="workspace-shell space-y-6">
      {/* <div className="grid gap-3 grid-cols-2 self-end">
        <div className="metric-tile rounded-[26px] p-5">
          <div className="section-kicker">Нөөцийн бэлэн байдал</div>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="text-4xl font-semibold tracking-tight">
                {stockCoverage}%
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                бараануудын энэ хувь нь доод босгоос дээш нөөцтэй байна.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="metric-tile rounded-[26px] p-5">
          <div className="section-kicker">Нөөцийн үнэ цэнэ</div>
          <div className="mt-3 text-4xl font-semibold tracking-tight">
            {formatCents(inventoryValue)}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Идэвхтэй бүх барааны өртгөөр тооцсон одоогийн нийт үнэ.
          </p>
        </div>
      </div> */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Өнөөдрийн орлого"
          value={formatCents(todaySales._sum.total ?? 0)}
          subtitle="Өнөөдөр баталгаажсан борлуулалтын нийт дүн."
          icon={DollarSign}
        />
        <KpiCard
          title="Сарын орлого"
          value={formatCents(monthRevenue)}
          subtitle="Одоогийн сарын хуримтлагдсан орлого."
          icon={TrendingUp}
        />
        <KpiCard
          title="Сарын зардал"
          value={formatCents(monthExpenseTotal)}
          subtitle="Энэ сард бүртгэгдсэн үйл ажиллагааны зардал."
          icon={Wallet}
        />
        <KpiCard
          title="Цэвэр ашиг"
          value={formatCents(monthProfit)}
          subtitle="Орлогоос зардлыг хассан дүн."
          icon={BarChart2}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
        <SalesChart data={chartData} />

        <div className="grid gap-4">
          <KpiCard
            title="Нийт бараа"
            value={totalItems.toString()}
            subtitle="Каталогт идэвхтэй байгаа барааны тоо."
            icon={Package}
          />
          <KpiCard
            title="Нөөцийн үнэ цэнэ"
            value={formatCents(inventoryValue)}
            subtitle="Өртгөөр тооцсон нөөцийн нийт дүн."
            icon={ShoppingCart}
          />
          <KpiCard
            title="Дуусах дөхсөн бараа"
            value={lowStockCount.toString()}
            subtitle="Дахин захиалах босгонд хүрсэн эсвэл доош орсон бараа."
            icon={AlertTriangle}
          />
        </div>
      </section>
    </div>
  );
}
