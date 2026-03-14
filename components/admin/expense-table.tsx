'use client'

import { useState } from 'react'
import type { Expense, ExpenseCategory } from '@prisma/client'
import type { DateRange } from 'react-day-picker'
import {
  createExpense,
  deleteExpense,
  updateExpense,
} from '@/app/admin/expenses/actions'
import {
  expenseCategoryOptions,
  getExpenseCategoryLabel,
} from '@/lib/localization'
import {
  endOfDay,
  formatCents,
  formatDate,
  parseToCents,
  startOfDay,
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  RENT: 'bg-blue-100 text-blue-700',
  UTILITIES: 'bg-yellow-100 text-yellow-700',
  SUPPLIES: 'bg-green-100 text-green-700',
  MARKETING: 'bg-purple-100 text-purple-700',
  SALARY: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-gray-100 text-gray-700',
}

interface FormData {
  amount: string
  category: ExpenseCategory
  description: string
  date: string
}

const emptyForm: FormData = {
  amount: '',
  category: 'OTHER',
  description: '',
  date: new Date().toISOString().slice(0, 10),
}

interface ExpenseTableProps {
  initialExpenses: Expense[]
}

export function ExpenseTable({ initialExpenses }: ExpenseTableProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const filtered = initialExpenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    const fromDate = dateRange?.from ? startOfDay(dateRange.from) : undefined
    const toDate = dateRange?.to
      ? endOfDay(dateRange.to)
      : dateRange?.from
        ? endOfDay(dateRange.from)
        : undefined

    if (fromDate && expenseDate < fromDate) return false
    if (toDate && expenseDate > toDate) return false
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
      return false
    }

    return true
  })

  const totalAmount = filtered.reduce((sum, expense) => sum + expense.amount, 0)
  const activeFilterCount = Number(Boolean(dateRange?.from)) + Number(categoryFilter !== 'all')
  const rangeLabel = dateRange?.from
    ? dateRange.to
      ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
      : formatDate(dateRange.from)
    : 'All time'

  const byCategory = expenseCategoryOptions.reduce<Record<string, number>>(
    (acc, option) => {
      acc[option.value] = filtered
        .filter((expense) => expense.category === option.value)
        .reduce((sum, expense) => sum + expense.amount, 0)
      return acc
    },
    {}
  )

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(expense: Expense) {
    setEditingId(expense.id)
    setForm({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      date: new Date(expense.date).toISOString().slice(0, 10),
    })
    setDialogOpen(true)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const data = {
      amount: parseToCents(form.amount),
      category: form.category,
      description: form.description,
      date: new Date(form.date),
    }

    try {
      if (editingId) {
        await updateExpense(editingId, data)
      } else {
        await createExpense(data)
      }
      setDialogOpen(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    await deleteExpense(deleteId)
    setDeleteId(null)
  }

  return (
    <div className='space-y-6'>
      <section className='panel-surface rounded-[30px] p-5 sm:p-6'>
        <div className='flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between'>
          <div>
            <div className='text-[11px] uppercase tracking-[0.28em] text-muted-foreground'>
              Expense control
            </div>
            <h2 className='mt-2 text-3xl font-semibold tracking-tight'>
              Track operating costs with cleaner filters.
            </h2>
            <p className='mt-2 max-w-2xl text-sm leading-6 text-muted-foreground'>
              Review expense totals, narrow by date or category, then add or update entries without leaving the page.
            </p>
          </div>

          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            <div className='metric-tile rounded-[24px] p-4'>
              <div className='text-sm text-muted-foreground'>Filtered total</div>
              <div className='mt-2 text-2xl font-semibold'>{formatCents(totalAmount)}</div>
            </div>
            <div className='metric-tile rounded-[24px] p-4'>
              <div className='text-sm text-muted-foreground'>Entries shown</div>
              <div className='mt-2 text-2xl font-semibold'>{filtered.length}</div>
            </div>
            <div className='metric-tile rounded-[24px] p-4 col-span-2 sm:col-span-1'>
              <div className='text-sm text-muted-foreground'>Active filters</div>
              <div className='mt-2 text-2xl font-semibold'>{activeFilterCount}</div>
            </div>
          </div>
        </div>
      </section>

      <Card className='panel-surface gap-0 border-white/70 py-0'>
        <CardHeader className='gap-4 border-b border-border/70 pb-4 pt-5 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <CardTitle className='text-xl font-semibold tracking-tight'>Expense ledger</CardTitle>
            <p className='mt-1 text-sm text-muted-foreground'>
              Range: {rangeLabel}
            </p>
          </div>
          <Button className='rounded-full' onClick={openCreate}>
            + Зардал нэмэх
          </Button>
        </CardHeader>

        <CardContent className='space-y-5 pb-6 pt-5'>
          <div className='flex flex-wrap items-center gap-3'>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder='Зардлын огнооны хүрээ'
            />
            {dateRange?.from ? (
              <Button
                variant='outline'
                className='rounded-full'
                onClick={() => setDateRange(undefined)}
              >
                Цэвэрлэх
              </Button>
            ) : null}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className='w-44 rounded-full border-white/70 bg-white/75'>
                <SelectValue placeholder='Ангилал' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Бүгд</SelectItem>
                {expenseCategoryOptions.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='overflow-hidden rounded-[24px] border border-border/70 bg-white/60'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/35 hover:bg-muted/35'>
                  <TableHead className='px-4'>Огноо</TableHead>
                  <TableHead>Ангилал</TableHead>
                  <TableHead>Тайлбар</TableHead>
                  <TableHead>Дүн</TableHead>
                  <TableHead className='pr-4'>Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='py-12 text-center text-muted-foreground'
                    >
                      Зардал олдсонгүй
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((expense) => (
                    <TableRow key={expense.id} className="glass-row border-white/20">
                      <TableCell className='px-4 text-sm'>
                        {formatDate(new Date(expense.date))}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_COLORS[expense.category]}`}
                        >
                          {getExpenseCategoryLabel(expense.category)}
                        </span>
                      </TableCell>
                      <TableCell className='max-w-[24rem] whitespace-normal text-sm text-muted-foreground'>
                        {expense.description}
                      </TableCell>
                      <TableCell className='font-medium'>
                        {formatCents(expense.amount)}
                      </TableCell>
                      <TableCell className='pr-4'>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            className='rounded-full'
                            onClick={() => openEdit(expense)}
                          >
                            Засах
                          </Button>
                          <Button
                            size='sm'
                            variant='destructive'
                            className='rounded-full'
                            onClick={() => setDeleteId(expense.id)}
                          >
                            Устгах
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className='bg-primary/5 font-semibold border-t border-white/20'>
                  <TableCell colSpan={3} className='pr-4 text-right'>
                    Нийт
                  </TableCell>
                  <TableCell>{formatCents(totalAmount)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <section className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {expenseCategoryOptions.map((category) => (
          <div key={category.value} className='metric-tile rounded-[24px] p-4'>
            <div className='text-sm text-muted-foreground'>{category.label}</div>
            <div className='mt-2 text-2xl font-semibold'>
              {formatCents(byCategory[category.value] ?? 0)}
            </div>
          </div>
        ))}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='glass-dialog rounded-[28px] border-white/60'>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Зардал засах' : 'Зардал нэмэх'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className='space-y-3'>
            <div className='space-y-1'>
              <Label>Дүн (MNT) *</Label>
              <Input
                required
                type='number'
                step='1'
                min='0'
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
              />
            </div>
            <div className='space-y-1'>
              <Label>Ангилал</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm({ ...form, category: value as ExpenseCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-dialog">
                  {expenseCategoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label>Тайлбар *</Label>
              <Textarea
                required
                rows={2}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </div>
            <div className='space-y-1'>
              <Label>Огноо</Label>
              <Input
                type='date'
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </div>
            <div className='flex justify-end gap-2 pt-1'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setDialogOpen(false)}
              >
                Болих
              </Button>
              <Button type='submit' disabled={loading}>
                {loading
                  ? 'Хадгалж байна...'
                  : editingId
                    ? 'Шинэчлэх'
                    : 'Үүсгэх'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent className='glass-dialog rounded-[28px] border-white/60'>
          <DialogHeader>
            <DialogTitle>Зардал устгах</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>
            Энэ зардлыг устгахдаа итгэлтэй байна уу?
          </p>
          <div className='flex justify-end gap-2 pt-2'>
            <Button variant='outline' onClick={() => setDeleteId(null)}>
              Болих
            </Button>
            <Button variant='destructive' onClick={handleDelete}>
              Устгах
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

