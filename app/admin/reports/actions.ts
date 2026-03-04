'use server'

import { assertAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function getReportData(fromDate: Date, toDate: Date) {
  await assertAdmin()

  const [sales, expenses, saleItems, allItems] = await Promise.all([
    prisma.sale.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: fromDate, lte: toDate } },
      select: { total: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: fromDate, lte: toDate } },
      select: { amount: true, category: true, description: true, date: true },
    }),
    prisma.saleItem.findMany({
      where: { sale: { status: 'COMPLETED', createdAt: { gte: fromDate, lte: toDate } } },
      include: { item: { select: { name: true, category: true } } },
    }),
    prisma.clothingItem.findMany({
      select: { id: true, name: true, category: true, costPrice: true, sellingPrice: true, stockQty: true, lowStockThreshold: true },
    }),
  ])

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  // Top 5 items by qty sold
  const qtySold: Record<number, { name: string; category: string; qty: number; revenue: number }> = {}
  for (const si of saleItems) {
    if (!qtySold[si.clotheId]) {
      qtySold[si.clotheId] = { name: si.item.name, category: si.item.category, qty: 0, revenue: 0 }
    }
    qtySold[si.clotheId].qty += si.qty
    qtySold[si.clotheId].revenue += si.total
  }
  const topItems = Object.values(qtySold)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  const inventoryItems = allItems.map((i) => ({
    name: i.name,
    category: i.category,
    stockQty: i.stockQty,
    costValue: i.costPrice * i.stockQty,
    sellValue: i.sellingPrice * i.stockQty,
    isLowStock: i.stockQty <= i.lowStockThreshold,
  }))

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    topItems,
    inventoryItems,
    expenseDetails: expenses.map((e) => ({
      ...e,
      date: e.date.toISOString().slice(0, 10),
    })),
    salesCount: sales.length,
  }
}
