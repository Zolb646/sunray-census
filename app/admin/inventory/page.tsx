import { prisma } from '@/lib/prisma'
import { InventoryTable } from '@/components/admin/inventory-table'

export default async function InventoryPage() {
  const items = await prisma.clothingItem.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return <InventoryTable initialItems={items} />
}
