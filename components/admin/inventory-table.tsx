'use client'

import { useState } from 'react'
import type { ClothingItem } from '@prisma/client'
import { createItem, updateItem, deleteItem } from '@/app/admin/inventory/actions'
import {
  getInventoryCategoryLabel,
  inventoryCategoryOptions,
} from '@/lib/localization'
import { formatCents, parseToCents } from '@/lib/utils'
import { StockModal } from './stock-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'

interface ItemFormData {
  name: string
  category: string
  sizes: string
  costPrice: string
  sellingPrice: string
  stockQty: string
  lowStockThreshold: string
  imageUrl: string
  description: string
}

const emptyForm: ItemFormData = {
  name: '',
  category: 'Top',
  sizes: '',
  costPrice: '',
  sellingPrice: '',
  stockQty: '0',
  lowStockThreshold: '5',
  imageUrl: '',
  description: '',
}

interface InventoryTableProps {
  initialItems: ClothingItem[]
}

export function InventoryTable({ initialItems }: InventoryTableProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null)
  const [form, setForm] = useState<ItemFormData>(emptyForm)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [stockModalItem, setStockModalItem] = useState<ClothingItem | null>(
    null
  )
  const [loading, setLoading] = useState(false)

  const filtered = initialItems.filter((item) => {
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toString().includes(search)
    const matchCategory =
      categoryFilter === 'all' || item.category === categoryFilter

    return matchSearch && matchCategory
  })

  function openCreate() {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(item: ClothingItem) {
    setEditingItem(item)
    setForm({
      name: item.name,
      category: item.category,
      sizes: item.sizes.join(', '),
      costPrice: (item.costPrice / 100).toFixed(2),
      sellingPrice: (item.sellingPrice / 100).toFixed(2),
      stockQty: item.stockQty.toString(),
      lowStockThreshold: item.lowStockThreshold.toString(),
      imageUrl: item.imageUrl ?? '',
      description: item.description ?? '',
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const data = {
      name: form.name,
      category: form.category,
      sizes: form.sizes
        .split(',')
        .map((size) => size.trim())
        .filter(Boolean),
      costPrice: parseToCents(form.costPrice),
      sellingPrice: parseToCents(form.sellingPrice),
      stockQty: parseInt(form.stockQty) || 0,
      lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
      imageUrl: form.imageUrl || undefined,
      description: form.description || undefined,
    }

    try {
      if (editingItem) {
        await updateItem(editingItem.id, data)
      } else {
        await createItem(data)
      }
      setDialogOpen(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    await deleteItem(deleteId)
    setDeleteId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex max-w-sm flex-1 items-center gap-2">
          <Input
            placeholder="Нэр эсвэл дугаараар хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Ангилал" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх ангилал</SelectItem>
            {inventoryCategoryOptions.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreate}>+ Бараа нэмэх</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>№</TableHead>
              <TableHead>Нэр</TableHead>
              <TableHead>Ангилал</TableHead>
              <TableHead>Хэмжээ</TableHead>
              <TableHead>Өртөг</TableHead>
              <TableHead>Зарах үнэ</TableHead>
              <TableHead>Нөөц</TableHead>
              <TableHead>Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-muted-foreground"
                >
                  Бараа олдсонгүй
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const isLow = item.stockQty <= item.lowStockThreshold

                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      #{item.id}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {getInventoryCategoryLabel(item.category)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.sizes.join(', ') || 'Байхгүй'}
                    </TableCell>
                    <TableCell>{formatCents(item.costPrice)}</TableCell>
                    <TableCell>{formatCents(item.sellingPrice)}</TableCell>
                    <TableCell>
                      <Badge variant={isLow ? 'destructive' : 'secondary'}>
                        {item.stockQty}
                        {isLow && ' ⚠'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(item)}
                        >
                          Засах
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setStockModalItem(item)}
                        >
                          Нөөц
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          Устгах
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Бараа засах' : 'Шинэ бараа нэмэх'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Нэр *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Ангилал</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm({ ...form, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryCategoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Хэмжээ (таслалаар)</Label>
                <Input
                  placeholder="XS, S, M, L, XL"
                  value={form.sizes}
                  onChange={(e) =>
                    setForm({ ...form, sizes: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Өртөг үнэ (USD) *</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.costPrice}
                  onChange={(e) =>
                    setForm({ ...form, costPrice: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Зарах үнэ (USD) *</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Эхний нөөц</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.stockQty}
                  onChange={(e) =>
                    setForm({ ...form, stockQty: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Доод нөөцийн босго</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lowStockThreshold: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Зургийн URL (заавал биш)</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm({ ...form, imageUrl: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Тайлбар (заавал биш)</Label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
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
                  : editingItem
                    ? 'Шинэчлэх'
                    : 'Үүсгэх'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {stockModalItem && (
        <StockModal
          itemId={stockModalItem.id}
          itemName={stockModalItem.name}
          open={!!stockModalItem}
          onOpenChange={(open) => !open && setStockModalItem(null)}
        />
      )}

      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Бараа устгах</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Энэ үйлдэл нь бараа болон түүнтэй холбоотой нөөцийн хөдөлгөөнийг
            бүр мөсөн устгана. Буцаах боломжгүй.
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
