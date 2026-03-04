'use server'

import { PaymentMethod } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface SaleItemInput {
  clotheId: number
  qty: number
  unitPrice: number
}

export async function createSale({
  items,
  paymentMethod,
  note,
}: {
  items: SaleItemInput[]
  paymentMethod: PaymentMethod
  note?: string
}) {
  await assertAdmin()

  const total = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0)

  const sale = await prisma.$transaction(async (tx) => {
    const newSale = await tx.sale.create({
      data: {
        total,
        paymentMethod,
        note,
        items: {
          create: items.map((item) => ({
            clotheId: item.clotheId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            total: item.qty * item.unitPrice,
          })),
        },
      },
    })

    for (const item of items) {
      await tx.clothingItem.update({
        where: { id: item.clotheId },
        data: { stockQty: { decrement: item.qty } },
      })
      await tx.stockMovement.create({
        data: {
          clotheId: item.clotheId,
          changeQty: -item.qty,
          reason: 'SALE',
          note: `Борлуулалт #${newSale.id}`,
        },
      })
    }

    return newSale
  })

  revalidatePath('/admin/sales')
  revalidatePath('/admin')
  return sale
}

export async function cancelSale(saleId: number) {
  await assertAdmin()

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  })

  if (!sale) throw new Error('Борлуулалт олдсонгүй')
  if (sale.status !== 'COMPLETED') {
    throw new Error('Энэ борлуулалтыг цуцлах боломжгүй байна')
  }

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({
      where: { id: saleId },
      data: { status: 'CANCELED' },
    })

    for (const item of sale.items) {
      await tx.clothingItem.update({
        where: { id: item.clotheId },
        data: { stockQty: { increment: item.qty } },
      })
      await tx.stockMovement.create({
        data: {
          clotheId: item.clotheId,
          changeQty: item.qty,
          reason: 'REFUND',
          note: `Цуцалсан борлуулалт #${saleId}`,
        },
      })
    }
  })

  revalidatePath('/admin/sales')
  revalidatePath('/admin')
}
