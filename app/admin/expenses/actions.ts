'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExpenseCategory } from '@prisma/client'

export interface ExpenseInput {
  amount: number
  category: ExpenseCategory
  description: string
  date?: Date
}

export async function createExpense(data: ExpenseInput) {
  await assertAdmin()
  await prisma.expense.create({ data })
  revalidatePath('/admin/expenses')
  revalidatePath('/admin')
}

export async function updateExpense(id: number, data: Partial<ExpenseInput>) {
  await assertAdmin()
  await prisma.expense.update({ where: { id }, data })
  revalidatePath('/admin/expenses')
  revalidatePath('/admin')
}

export async function deleteExpense(id: number) {
  await assertAdmin()
  await prisma.expense.delete({ where: { id } })
  revalidatePath('/admin/expenses')
  revalidatePath('/admin')
}
