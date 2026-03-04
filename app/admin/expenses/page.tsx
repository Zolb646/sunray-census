import { prisma } from '@/lib/prisma'
import { ExpenseTable } from '@/components/admin/expense-table'

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' },
  })

  return <ExpenseTable initialExpenses={expenses} />
}
