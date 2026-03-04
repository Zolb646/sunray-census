'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { StockReason } from '@prisma/client'

export interface ClothingItemInput {
  name: string
  category: string
  sizes: string[]
  costPrice: number
  sellingPrice: number
  stockQty: number
  lowStockThreshold: number
  imageUrl?: string
  description?: string
}

export async function createItem(data: ClothingItemInput) {
  await assertAdmin()
  await prisma.clothingItem.create({ data })
  revalidatePath('/admin/inventory')
  revalidatePath('/admin')
}

export async function updateItem(id: number, data: Partial<ClothingItemInput>) {
  await assertAdmin()
  await prisma.clothingItem.update({ where: { id }, data })
  revalidatePath('/admin/inventory')
  revalidatePath('/admin')
}

export async function deleteItem(id: number) {
  await assertAdmin()
  await prisma.clothingItem.delete({ where: { id } })
  revalidatePath('/admin/inventory')
  revalidatePath('/admin')
}

export async function adjustStock({
  clotheId,
  changeQty,
  reason,
  note,
}: {
  clotheId: number
  changeQty: number
  reason: StockReason
  note?: string
}) {
  await assertAdmin()
  await prisma.$transaction([
    prisma.clothingItem.update({
      where: { id: clotheId },
      data: { stockQty: { increment: changeQty } },
    }),
    prisma.stockMovement.create({
      data: { clotheId, changeQty, reason, note },
    }),
  ])
  revalidatePath('/admin/inventory')
  revalidatePath('/admin')
}
