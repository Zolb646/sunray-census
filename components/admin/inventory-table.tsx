'use client'

import { useState } from 'react'
import type { ClothingItem } from '@prisma/client'
import { createItem, deleteItem, updateItem } from '@/app/admin/inventory/actions'
import {
  getInventoryCategoryLabel,
  inventoryCategoryOptions,
} from '@/lib/localization'
import { formatCents, parseToCents } from '@/lib/utils'
import { StockModal } from './stock-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const [stockModalItem, setStockModalItem] = useState<ClothingItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const filtered = initialItems.filter((item) => {
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toString().includes(search)
    const matchCategory =
      categoryFilter === 'all' || item.category === categoryFilter

    return matchSearch && matchCategory
  })

  function resetForm() {
    setForm(emptyForm)
    setUploadError('')
    setUploadingImage(false)
  }

  function openCreate() {
    setEditingItem(null)
    resetForm()
    setDialogOpen(true)
  }

  function openEdit(item: ClothingItem) {
    setEditingItem(item)
    setUploadError('')
    setUploadingImage(false)
    setForm({
      name: item.name,
      category: item.category,
      sizes: item.sizes.join(', '),
      costPrice: item.costPrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      stockQty: item.stockQty.toString(),
      lowStockThreshold: item.lowStockThreshold.toString(),
      imageUrl: item.imageUrl ?? '',
      description: item.description ?? '',
    })
    setDialogOpen(true)
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      const result = (await response.json()) as { error?: string; url?: string }

      if (!response.ok || !result.url) {
        throw new Error(result.error ?? 'Image upload failed.')
      }

      setForm((current) => ({
        ...current,
        imageUrl: result.url ?? '',
      }))
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Image upload failed.')
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
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
    <div className='space-y-4'>
      <div className='panel-surface flex flex-wrap items-center justify-between gap-4 rounded-2xl border-white/70 p-4'>
        <div className='flex max-w-sm flex-1 items-center gap-2'>
          <Input
            placeholder='Нэр эсвэл дугаараар хайх...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className='bg-white/50 border-white/40 focus-visible:ring-primary/40'
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className='w-40 bg-white/50 border-white/40 focus:ring-primary/40'>
            <SelectValue placeholder='Ангилал' />
          </SelectTrigger>
          <SelectContent className='glass-dialog'>
            <SelectItem value='all'>Бүх ангилал</SelectItem>
            {inventoryCategoryOptions.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className='rounded-xl shadow-sm'>+ Бараа нэмэх</Button>
      </div>

      <div className='panel-surface rounded-[24px] border-white/70'>
        <Table>
          <TableHeader className='bg-primary/5'>
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
                <TableCell colSpan={8} className='py-8 text-center text-muted-foreground'>
                  Бараа олдсонгүй
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const isLow = item.stockQty <= item.lowStockThreshold

                return (
                  <TableRow key={item.id} className='glass-row border-white/20'>
                    <TableCell className='text-sm text-foreground/70'>
                      #{item.id}
                    </TableCell>
                    <TableCell className='font-medium'>{item.name}</TableCell>
                    <TableCell>
                      {getInventoryCategoryLabel(item.category)}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
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
                      <div className='flex gap-1'>
                        <Button size='sm' variant='outline' onClick={() => openEdit(item)}>
                          Засах
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setStockModalItem(item)}
                        >
                          Нөөц
                        </Button>
                        <Button
                          size='sm'
                          variant='destructive'
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
        <DialogContent className='glass-dialog max-w-lg border-white/60'>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Бараа засах' : 'Шинэ бараа нэмэх'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <div className='col-span-2 space-y-1'>
                <Label>Нэр *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Ангилал</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='glass-dialog'>
                    {inventoryCategoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-1'>
                <Label>Хэмжээ (таслалаар)</Label>
                <Input
                  placeholder='XS, S, M, L, XL'
                  value={form.sizes}
                  onChange={(event) => setForm({ ...form, sizes: event.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Өртөг үнэ (MNT) *</Label>
                <Input
                  required
                  type='number'
                  step='1'
                  min='0'
                  value={form.costPrice}
                  onChange={(event) => setForm({ ...form, costPrice: event.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Зарах үнэ (MNT) *</Label>
                <Input
                  required
                  type='number'
                  step='1'
                  min='0'
                  value={form.sellingPrice}
                  onChange={(event) => setForm({ ...form, sellingPrice: event.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Эхний нөөц</Label>
                <Input
                  type='number'
                  min='0'
                  value={form.stockQty}
                  onChange={(event) => setForm({ ...form, stockQty: event.target.value })}
                />
              </div>
              <div className='space-y-1'>
                <Label>Доод нөөцийн босго</Label>
                <Input
                  type='number'
                  min='0'
                  value={form.lowStockThreshold}
                  onChange={(event) =>
                    setForm({ ...form, lowStockThreshold: event.target.value })
                  }
                />
              </div>
              <div className='col-span-2 space-y-2'>
                <Label>Зураг (заавал биш)</Label>
                <div className='rounded-lg border border-dashed p-3'>
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-start'>
                    <label className='inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent'>
                      <span>{uploadingImage ? 'Зураг байршуулж байна...' : 'Зураг сонгох'}</span>
                      <input
                        type='file'
                        accept='image/png,image/jpeg,image/webp,image/gif'
                        className='hidden'
                        disabled={uploadingImage}
                        onChange={handleImageUpload}
                      />
                    </label>
                    <div className='text-xs text-muted-foreground'>
                      JPG, PNG, WEBP, GIF. Max 5MB. Зураггүйгээр хадгалж болно.
                    </div>
                  </div>
                  {uploadError ? (
                    <p className='mt-2 text-sm text-destructive'>{uploadError}</p>
                  ) : null}
                  {form.imageUrl ? (
                    <div className='mt-3 flex items-start gap-3'>
                      <div className='h-24 w-24 overflow-hidden rounded-md border bg-muted'>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.imageUrl}
                          alt='Item preview'
                          className='h-full w-full object-cover'
                        />
                      </div>
                      <div className='flex-1 space-y-2'>
                        <p className='break-all text-xs text-muted-foreground'>
                          {form.imageUrl}
                        </p>
                        <Button
                          type='button'
                          size='sm'
                          variant='outline'
                          onClick={() => setForm({ ...form, imageUrl: '' })}
                        >
                          Зураг арилгах
                        </Button>
                      </div>
                      </div>
                  ) : null}
                </div>
              </div>
              <div className='col-span-2 space-y-1'>
                <Label>Тайлбар (заавал биш)</Label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </div>
            </div>
            <div className='flex justify-end gap-2 pt-1'>
              <Button type='button' variant='outline' onClick={() => setDialogOpen(false)}>
                Болих
              </Button>
              <Button type='submit' disabled={loading || uploadingImage}>
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

      {stockModalItem ? (
        <StockModal
          itemId={stockModalItem.id}
          itemName={stockModalItem.name}
          open={!!stockModalItem}
          onOpenChange={(open) => !open && setStockModalItem(null)}
        />
      ) : null}

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className='glass-dialog border-white/60'>
          <DialogHeader>
            <DialogTitle>Бараа устгах</DialogTitle>
          </DialogHeader>
          <p className='text-sm text-muted-foreground'>
            Энэ үйлдэл нь бараа болон түүнтэй холбоотой нөөцийн хөдөлгөөнийг
            бүр мөсөн устгана. Буцаах боломжгүй.
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
