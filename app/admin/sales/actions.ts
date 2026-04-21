'use server'

import { PaymentMethod, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface SaleItemInput {
  clotheId: number
  qty: number
  unitPrice: number
}

export interface SalePaymentInput {
  method: PaymentMethod
  amount: number
}

function getPrimaryPaymentMethod(payments: SalePaymentInput[]) {
  return payments
    .slice()
    .sort((left, right) => right.amount - left.amount)[0]?.method ?? 'CASH'
}

export async function createSale({
  items,
  payments,
  note,
}: {
  items: SaleItemInput[]
  payments: SalePaymentInput[]
  note?: string
}) {
  await assertAdmin()

  if (items.length === 0) {
    throw new Error('Дор хаяж нэг барааны мөр нэмнэ үү')
  }

  if (payments.length === 0) {
    throw new Error('Дор хаяж нэг төлбөрийн хэлбэр нэмнэ үү')
  }

  const mergedItems = new Map<number, SaleItemInput>()

  for (const item of items) {
    if (item.qty <= 0) {
      throw new Error('Тоо хэмжээ 0-ээс их байх ёстой')
    }

    if (item.unitPrice < 0) {
      throw new Error('Нэгж үнэ буруу байна')
    }

    const existing = mergedItems.get(item.clotheId)
    if (existing) {
      existing.qty += item.qty
      existing.unitPrice = item.unitPrice
      continue
    }

    mergedItems.set(item.clotheId, { ...item })
  }

  const normalizedItems = Array.from(mergedItems.values())
  const total = normalizedItems.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0,
  )

  const mergedPayments = new Map<PaymentMethod, number>()

  for (const payment of payments) {
    if (payment.amount <= 0) {
      throw new Error('Төлбөрийн дүн 0-ээс их байх ёстой')
    }

    mergedPayments.set(
      payment.method,
      (mergedPayments.get(payment.method) ?? 0) + payment.amount,
    )
  }

  const normalizedPayments = Array.from(mergedPayments.entries()).map(
    ([method, amount]) => ({ method, amount }),
  )
  const paidTotal = normalizedPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  )

  if (paidTotal !== total) {
    throw new Error('Төлбөрийн хуваалт борлуулалтын нийт дүнтэй яг тэнцүү байх ёстой')
  }

  const paymentMethod = getPrimaryPaymentMethod(normalizedPayments)
  const paymentBreakdown = normalizedPayments as Prisma.InputJsonValue

  const sale = await prisma.$transaction(async (tx) => {
    const stockItems = await tx.clothingItem.findMany({
      where: {
        id: { in: normalizedItems.map((item) => item.clotheId) },
      },
      select: {
        id: true,
        stockQty: true,
      },
    })

    const stockById = new Map(stockItems.map((item) => [item.id, item.stockQty]))

    for (const item of normalizedItems) {
      const stockQty = stockById.get(item.clotheId)

      if (stockQty === undefined) {
        throw new Error('Сонгосон бараа олдсонгүй')
      }

      if (stockQty < item.qty) {
        throw new Error('Нэг эсвэл хэд хэдэн барааны нөөц хүрэлцэхгүй байна')
      }
    }

    const newSale = await tx.sale.create({
      data: {
        total,
        paymentMethod,
        paymentBreakdown,
        note,
        items: {
          create: normalizedItems.map((item) => ({
            clotheId: item.clotheId,
            qty: item.qty,
            unitPrice: item.unitPrice,
            total: item.qty * item.unitPrice,
          })),
        },
      },
    })

    for (const item of normalizedItems) {
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
    throw new Error('Энэ борлуулалтыг цуцлах боломжгүй')
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
          note: `Цуцлагдсан борлуулалт #${saleId}`,
        },
      })
    }
  })

  revalidatePath('/admin/sales')
  revalidatePath('/admin')
}
