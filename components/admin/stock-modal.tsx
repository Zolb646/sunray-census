'use client'

import { useState } from 'react'
import { StockReason } from '@prisma/client'
import { adjustStock } from '@/app/admin/inventory/actions'
import { stockReasonOptions } from '@/lib/localization'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface StockModalProps {
  itemId: number
  itemName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StockModal({
  itemId,
  itemName,
  open,
  onOpenChange,
}: StockModalProps) {
  const [reason, setReason] = useState<StockReason>('RESTOCK')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedReason = stockReasonOptions.find(
    (option) => option.value === reason
  )!

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const absQty = parseInt(qty)

    if (!absQty || absQty <= 0) return

    setLoading(true)
    try {
      await adjustStock({
        clotheId: itemId,
        changeQty: selectedReason.sign * absQty,
        reason,
        note: note || undefined,
      })
      onOpenChange(false)
      setQty('')
      setNote('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Нөөц тохируулах: {itemName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Шалтгаан</Label>
            <Select
              value={reason}
              onValueChange={(value) => setReason(value as StockReason)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stockReasonOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Тоо хэмжээ</Label>
            <Input
              type="number"
              min="1"
              placeholder="Тоо оруулна уу"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Тайлбар (заавал биш)</Label>
            <Textarea
              placeholder="Нэмэлт тайлбар..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Болих
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Хадгалж байна...' : 'Хадгалах'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
