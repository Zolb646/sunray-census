"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ClothingItem,
  PaymentMethod,
  Sale,
  SaleItem,
} from "@prisma/client";
import { cancelSale, createSale } from "@/app/admin/sales/actions";
import {
  formatPaymentBreakdown,
  getSaleStatusLabel,
  paymentMethodOptions,
} from "@/lib/localization";
import { formatCents, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type SaleWithItems = Sale & {
  items: (SaleItem & { item: ClothingItem })[];
};

interface SalesViewProps {
  initialSales: SaleWithItems[];
  availableItems: ClothingItem[];
}

interface SaleDraftLine {
  key: number;
  itemId: string;
  qty: string;
}

interface PaymentDraftLine {
  key: number;
  method: PaymentMethod;
  amount: string;
}

interface CartLine {
  key: number;
  clotheId: number;
  name: string;
  qty: number;
  unitPrice: number;
  stockQty: number;
}

const STATUS_COLORS: Record<string, "default" | "destructive" | "secondary"> = {
  COMPLETED: "default",
  CANCELED: "destructive",
  REFUNDED: "secondary",
};

function createDraftLine(key: number): SaleDraftLine {
  return {
    key,
    itemId: "",
    qty: "1",
  };
}

function createPaymentLine(key: number): PaymentDraftLine {
  return {
    key,
    method: "CASH",
    amount: "0",
  };
}

export function SalesView({ initialSales, availableItems }: SalesViewProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [draftLines, setDraftLines] = useState<SaleDraftLine[]>([createDraftLine(1)]);
  const [paymentLines, setPaymentLines] = useState<PaymentDraftLine[]>([
    createPaymentLine(1),
  ]);
  const [nextLineKey, setNextLineKey] = useState(2);
  const [nextPaymentKey, setNextPaymentKey] = useState(2);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cart = useMemo<CartLine[]>(() => {
    return draftLines
      .map((line) => {
        const item = availableItems.find(
          (entry) => entry.id === Number.parseInt(line.itemId, 10),
        );

        if (!item) {
          return null;
        }

        const parsedQty = Number.parseInt(line.qty, 10);
        const qty = parsedQty > 0 ? parsedQty : 1;

        return {
          key: line.key,
          clotheId: item.id,
          name: item.name,
          qty,
          unitPrice: item.sellingPrice,
          stockQty: item.stockQty,
        };
      })
      .filter((line): line is CartLine => line !== null);
  }, [availableItems, draftLines]);

  const cartTotal = cart.reduce(
    (sum, line) => sum + line.qty * line.unitPrice,
    0,
  );

  const paymentTotal = useMemo(
    () =>
      paymentLines.reduce((sum, line) => {
        const amount = Number.parseInt(line.amount, 10);
        return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
      }, 0),
    [paymentLines],
  );

  const paymentDifference = cartTotal - paymentTotal;

  useEffect(() => {
    if (paymentLines.length !== 1) {
      return;
    }

    setPaymentLines((prev) => {
      if (prev.length !== 1) {
        return prev;
      }

      const nextAmount = cartTotal > 0 ? String(cartTotal) : "0";
      if (prev[0].amount === nextAmount) {
        return prev;
      }

      return [{ ...prev[0], amount: nextAmount }];
    });
  }, [cartTotal, paymentLines.length]);

  function resetSaleForm() {
    setDraftLines([createDraftLine(1)]);
    setPaymentLines([createPaymentLine(1)]);
    setNextLineKey(2);
    setNextPaymentKey(2);
    setNote("");
    setError("");
  }

  function handleOpenChange(open: boolean) {
    setCreateOpen(open);
    if (!open) {
      resetSaleForm();
    }
  }

  function addLine() {
    setDraftLines((prev) => [...prev, createDraftLine(nextLineKey)]);
    setNextLineKey((prev) => prev + 1);
  }

  function updateLine(key: number, patch: Partial<SaleDraftLine>) {
    setDraftLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
    setError("");
  }

  function removeLine(key: number) {
    setDraftLines((prev) => {
      if (prev.length === 1) {
        return [createDraftLine(key)];
      }

      return prev.filter((line) => line.key !== key);
    });
    setError("");
  }

  function addPaymentLine() {
    setPaymentLines((prev) => [...prev, createPaymentLine(nextPaymentKey)]);
    setNextPaymentKey((prev) => prev + 1);
  }

  function updatePaymentLine(key: number, patch: Partial<PaymentDraftLine>) {
    setPaymentLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
    setError("");
  }

  function removePaymentLine(key: number) {
    setPaymentLines((prev) => {
      if (prev.length === 1) {
        return [createPaymentLine(key)];
      }

      return prev.filter((line) => line.key !== key);
    });
    setError("");
  }

  function fillRemainingAmount(key: number) {
    const current = paymentLines.find((line) => line.key === key);
    if (!current) {
      return;
    }

    const currentAmount = Number.parseInt(current.amount, 10);
    const safeCurrentAmount =
      Number.isFinite(currentAmount) && currentAmount > 0 ? currentAmount : 0;
    const nextAmount = Math.max(paymentDifference + safeCurrentAmount, 0);

    updatePaymentLine(key, { amount: String(nextAmount) });
  }

  async function handleCreateSale(e: React.FormEvent) {
    e.preventDefault();

    if (cart.length === 0) {
      setError("Select at least one item.");
      return;
    }

    const normalizedPayments = paymentLines
      .map((line) => ({
        method: line.method,
        amount: Number.parseInt(line.amount, 10),
      }))
      .filter((line) => Number.isFinite(line.amount) && line.amount > 0);

    if (normalizedPayments.length === 0) {
      setError("Add at least one payment amount.");
      return;
    }

    if (paymentDifference !== 0) {
      setError("Payment total must match the sale total exactly.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createSale({
        items: cart.map((line) => ({
          clotheId: line.clotheId,
          qty: line.qty,
          unitPrice: line.unitPrice,
        })),
        payments: normalizedPayments,
        note: note || undefined,
      });
      setCreateOpen(false);
      resetSaleForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create sale.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!cancelId) return;

    setLoading(true);
    try {
      await cancelSale(cancelId);
      setCancelId(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>+ Add Sale</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payments</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialSales.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground">
                  No sales yet
                </TableCell>
              </TableRow>
            ) : (
              initialSales.map((sale) => {
                const saleItemsLabel = sale.items
                  .map((item) => `${item.item.name} x${item.qty}`)
                  .join(", ");

                return (
                  <TableRow key={sale.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      #{sale.id}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(new Date(sale.createdAt))}
                    </TableCell>
                    <TableCell className="max-w-xs text-sm">
                      <div className="truncate" title={saleItemsLabel}>
                        {saleItemsLabel}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCents(sale.total)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPaymentBreakdown(
                        sale.paymentBreakdown,
                        sale.paymentMethod,
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_COLORS[sale.status] ?? "secondary"}>
                        {getSaleStatusLabel(sale.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sale.status === "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setCancelId(sale.id)}>
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={createOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="min-w-2xl">
          <DialogHeader>
            <DialogTitle>New Sale</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSale} className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Add multiple items in one sale</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  + Add Line
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {draftLines.map((line, index) => {
                  const selectedIds = draftLines
                    .filter((entry) => entry.key !== line.key && entry.itemId !== "")
                    .map((entry) => entry.itemId);

                  return (
                    <div
                      key={line.key}
                      className="grid grid-cols-[minmax(0,1fr)_96px_88px] gap-2 rounded-lg border p-3">
                      <div className="space-y-1">
                        <Label>Item {index + 1}</Label>
                        <Select
                          value={line.itemId}
                          onValueChange={(value) => updateLine(line.key, { itemId: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select item..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableItems.map((item) => (
                              <SelectItem
                                key={item.id}
                                value={item.id.toString()}
                                disabled={selectedIds.includes(item.id.toString())}>
                                {item.name} - {formatCents(item.sellingPrice)} (stock: {item.stockQty})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={line.qty}
                          onChange={(e) => updateLine(line.key, { qty: e.target.value })}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full text-destructive"
                          onClick={() => removeLine(line.key)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {cart.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      {cart.map((line) => (
                        <div
                          key={line.key}
                          className="flex items-center justify-between rounded bg-muted/50 px-3 py-2 text-sm">
                          <div>
                            <div className="font-medium">{line.name}</div>
                            <div className="text-muted-foreground">
                              {line.qty} x {formatCents(line.unitPrice)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCents(line.qty * line.unitPrice)}
                            </div>
                            <div className="text-muted-foreground">
                              Stock: {line.stockQty}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="flex justify-between px-2 text-sm font-semibold">
                      <span>Total</span>
                      <span>{formatCents(cartTotal)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Split payment</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPaymentLine}>
                  + Add Payment
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentLines.map((line, index) => {
                  const selectedMethods = paymentLines
                    .filter((entry) => entry.key !== line.key)
                    .map((entry) => entry.method);

                  return (
                    <div
                      key={line.key}
                      className="grid grid-cols-[minmax(0,1fr)_120px_120px_88px] gap-2 rounded-lg border p-3">
                      <div className="space-y-1">
                        <Label>Payment {index + 1}</Label>
                        <Select
                          value={line.method}
                          onValueChange={(value) =>
                            updatePaymentLine(line.key, {
                              method: value as PaymentMethod,
                            })
                          }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethodOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                disabled={selectedMethods.includes(option.value)}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={line.amount}
                          onChange={(e) =>
                            updatePaymentLine(line.key, { amount: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => fillRemainingAmount(line.key)}>
                          Fill Rest
                        </Button>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full text-destructive"
                          onClick={() => removePaymentLine(line.key)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                  <span>Paid so far</span>
                  <span>{formatCents(paymentTotal)}</span>
                </div>
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>Remaining</span>
                  <span
                    className={
                      paymentDifference === 0
                        ? "text-green-600"
                        : "text-destructive"
                    }>
                    {formatCents(paymentDifference)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-1">
              <Label>Note (optional)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={1}
              />
            </div>

            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}>
                Close
              </Button>
              <Button type="submit" disabled={loading || cart.length === 0}>
                {loading ? "Saving..." : `Create Sale (${formatCents(cartTotal)})`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel sale #{cancelId}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will cancel the sale and return all linked stock. This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>
              Back
            </Button>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={handleCancel}>
              {loading ? "Canceling..." : "Cancel Sale"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}