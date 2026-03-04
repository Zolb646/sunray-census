'use client'

import { useState } from 'react'
import type { Expense, ExpenseCategory } from '@prisma/client'
import type { DateRange } from 'react-day-picker'
import {
  createExpense,
  updateExpense,
  deleteExpense,
} from '@/app/admin/expenses/actions'
import {
  expenseCategoryOptions,
  getExpenseCategoryLabel,
} from '@/lib/localization'
import { formatCents, formatDate, parseToCents } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
    const date = new Date(expense.date)
    const fromDate = dateRange?.from
    const toDate = dateRange?.to ?? dateRange?.from

    if (fromDate) {
      const start = new Date(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate()
      )
      if (date < start) return false
    }

    if (toDate) {
      const end = new Date(
        toDate.getFullYear(),
        toDate.getMonth(),
        toDate.getDate(),
        23,
        59,
        59,
        999
      )
      if (date > end) return false
    }

    if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
      return false
    }

    return true
  })

  const totalAmount = filtered.reduce((sum, expense) => sum + expense.amount, 0)

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
      amount: (expense.amount / 100).toFixed(2),
      category: expense.category,
      description: expense.description,
      date: new Date(expense.date).toISOString().slice(0, 10),
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          placeholder="Зардлын огнооны хүрээ"
        />
        {dateRange?.from && (
          <Button
            variant="outline"
            onClick={() => setDateRange(undefined)}
          >
            Цэвэрлэх
          </Button>
        )}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Ангилал" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүгд</SelectItem>
            {expenseCategoryOptions.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button onClick={openCreate}>+ Зардал нэмэх</Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Огноо</TableHead>
              <TableHead>Ангилал</TableHead>
              <TableHead>Тайлбар</TableHead>
              <TableHead>Дүн</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  Зардал олдсонгүй
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-sm">
                    {formatDate(new Date(expense.date))}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[expense.category]}`}
                    >
                      {getExpenseCategoryLabel(expense.category)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {expense.description}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCents(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(expense)}
                      >
                        Засах
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteId(expense.id)}
                      >
                        Устгах
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell colSpan={3} className="pr-4 text-right">
                Нийт
              </TableCell>
              <TableCell>{formatCents(totalAmount)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {expenseCategoryOptions.map((category) => (
          <div key={category.value} className="rounded-md border p-3 text-center">
            <div className="text-xs text-muted-foreground">{category.label}</div>
            <div className="mt-1 text-sm font-semibold">
              {formatCents(byCategory[category.value] ?? 0)}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Зардал засах' : 'Зардал нэмэх'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Дүн (USD) *</Label>
              <Input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="space-y-1">
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
                <SelectContent>
                  {expenseCategoryOptions.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Тайлбар *</Label>
              <Textarea
                required
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Огноо</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Болих
              </Button>
              <Button type="submit" disabled={loading}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Зардал устгах</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Энэ зардлыг устгахдаа итгэлтэй байна уу?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Болих
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Устгах
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
