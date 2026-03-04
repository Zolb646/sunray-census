'use client'

import { useState } from 'react'
import type {
  ClothingItem,
  PaymentMethod,
  Sale,
  SaleItem,
} from '@prisma/client'
import { createSale, cancelSale } from '@/app/admin/sales/actions'
import {
  getPaymentMethodLabel,
  getSaleStatusLabel,
  paymentMethodOptions,
} from '@/lib/localization'
import { formatCents, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SaleWithItems = Sale & {
  items: (SaleItem & { item: ClothingItem })[]
}

interface SalesViewProps {
  initialSales: SaleWithItems[]
  availableItems: ClothingItem[]
}

interface CartLine {
  clotheId: number
  name: string
  qty: number
  unitPrice: number
}

const STATUS_COLORS: Record<string, 'default' | 'destructive' | 'secondary'> = {
  COMPLETED: 'default',
  CANCELED: 'destructive',
  REFUNDED: 'secondary',
}

export function SalesView({ initialSales, availableItems }: SalesViewProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [cancelId, setCancelId] = useState<number | null>(null)
  const [cart, setCart] = useState<CartLine[]>([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [qty, setQty] = useState('1')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const cartTotal = cart.reduce((sum, line) => sum + line.qty * line.unitPrice, 0)

  function addToCart() {
    const item = availableItems.find((entry) => entry.id === parseInt(selectedItemId))
    if (!item) return

    const parsedQty = parseInt(qty)
    const nextQty = parsedQty > 0 ? parsedQty : 1

    setCart((prev) => {
      const existing = prev.find((line) => line.clotheId === item.id)
      if (existing) {
        return prev.map((line) =>
          line.clotheId === item.id
            ? { ...line, qty: line.qty + nextQty }
            : line
        )
      }

      return [
        ...prev,
        {
          clotheId: item.id,
          name: item.name,
          qty: nextQty,
          unitPrice: item.sellingPrice,
        },
      ]
    })

    setSelectedItemId('')
    setQty('1')
  }

  function removeFromCart(clotheId: number) {
    setCart((prev) => prev.filter((line) => line.clotheId !== clotheId))
  }

  async function handleCreateSale(e: React.FormEvent) {
    e.preventDefault()
    if (cart.length === 0) return

    setLoading(true)
    try {
      await createSale({
        items: cart.map((line) => ({
          clotheId: line.clotheId,
          qty: line.qty,
          unitPrice: line.unitPrice,
        })),
        paymentMethod,
        note: note || undefined,
      })
      setCreateOpen(false)
      setCart([])
      setNote('')
      setPaymentMethod('CASH')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!cancelId) return

    setLoading(true)
    try {
      await cancelSale(cancelId)
      setCancelId(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>+ Борлуулалт бүртгэх</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>№</TableHead>
              <TableHead>Огноо</TableHead>
              <TableHead>Бараа</TableHead>
              <TableHead>Нийт</TableHead>
              <TableHead>Төлбөр</TableHead>
              <TableHead>Төлөв</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialSales.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  Борлуулалт алга
                </TableCell>
              </TableRow>
            ) : (
              initialSales.map((sale) => {
                const totalQty = sale.items.reduce((sum, item) => sum + item.qty, 0)

                return (
                  <TableRow key={sale.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      #{sale.id}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(new Date(sale.createdAt))}
                    </TableCell>
                    <TableCell className="text-sm">{totalQty} ширхэг</TableCell>
                    <TableCell className="font-medium">
                      {formatCents(sale.total)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getPaymentMethodLabel(sale.paymentMethod)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[sale.status] ?? 'secondary'}>
                        {getSaleStatusLabel(sale.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sale.status === 'COMPLETED' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setCancelId(sale.id)}
                        >
                          Цуцлах
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Шинэ борлуулалт</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSale} className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Бараа нэмэх</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Бараа сонгох..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableItems.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} - {formatCents(item.sellingPrice)} (нөөц:{' '}
                          {item.stockQty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-20"
                  />
                  <Button
                    type="button"
                    onClick={addToCart}
                    disabled={!selectedItemId}
                  >
                    Нэмэх
                  </Button>
                </div>

                {cart.length > 0 && (
                  <div className="space-y-1">
                    {cart.map((line) => (
                      <div
                        key={line.clotheId}
                        className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-sm"
                      >
                        <span>{line.name}</span>
                        <span className="text-muted-foreground">
                          {line.qty} x {formatCents(line.unitPrice)} ={' '}
                          {formatCents(line.qty * line.unitPrice)}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(line.clotheId)}
                          className="h-6 px-1 text-destructive"
                        >
                          x
                        </Button>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between px-2 text-sm font-semibold">
                      <span>Нийт</span>
                      <span>{formatCents(cartTotal)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Төлбөрийн хэлбэр</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Тэмдэглэл (заавал биш)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={1}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Болих
              </Button>
              <Button type="submit" disabled={loading || cart.length === 0}>
                {loading
                  ? 'Бүртгэж байна...'
                  : `Борлуулалт бүртгэх (${formatCents(cartTotal)})`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Борлуулалт #{cancelId} цуцлах</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Энэ үйлдэл нь борлуулалтыг цуцалж, холбоотой бүх нөөцийг буцаан
            нэмнэ. Буцаах боломжгүй.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>
              Буцах
            </Button>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={handleCancel}
            >
              {loading ? 'Цуцалж байна...' : 'Цуцлах'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
