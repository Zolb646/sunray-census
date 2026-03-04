import { prisma } from '@/lib/prisma'
import { SalesView } from '@/components/admin/sales-view'

export default async function SalesPage() {
  const [sales, items] = await Promise.all([
    prisma.sale.findMany({
      include: { items: { include: { item: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.clothingItem.findMany({
      where: { stockQty: { gt: 0 } },
      orderBy: { name: 'asc' },
    }),
  ])

  return <SalesView initialSales={sales} availableItems={items} />
}
