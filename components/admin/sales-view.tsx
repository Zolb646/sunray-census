"use client";

import { useMemo, useState } from "react";
import type {
  ClothingItem,
  PaymentMethod,
  Sale,
  SaleItem,
} from "@prisma/client";
import { Layers3 } from "lucide-react";
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
  const [draftLines, setDraftLines] = useState<SaleDraftLine[]>([
    createDraftLine(1),
  ]);
  const [paymentLines, setPaymentLines] = useState<PaymentDraftLine[]>([
    createPaymentLine(1),
  ]);
  const [nextLineKey, setNextLineKey] = useState(2);
  const [nextPaymentKey, setNextPaymentKey] = useState(2);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const completedSales = initialSales.filter(
    (sale) => sale.status === "COMPLETED",
  );
  const completedRevenue = completedSales.reduce(
    (sum, sale) => sum + sale.total,
    0,
  );
  const canceledSales = initialSales.filter(
    (sale) => sale.status === "CANCELED",
  ).length;
  const unitsSold = completedSales.reduce(
    (sum, sale) =>
      sum + sale.items.reduce((itemSum, item) => itemSum + item.qty, 0),
    0,
  );

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

  const displayPaymentLines =
    paymentLines.length === 1
      ? [
          {
            ...paymentLines[0],
            amount: cartTotal > 0 ? String(cartTotal) : "0",
          },
        ]
      : paymentLines;

  async function handleCreateSale(e: React.FormEvent) {
    e.preventDefault();

    if (cart.length === 0) {
      setError("Дор хаяж нэг бараа сонгоно уу.");
      return;
    }

    const normalizedPayments = displayPaymentLines
      .map((line) => ({
        method: line.method,
        amount: Number.parseInt(line.amount, 10),
      }))
      .filter((line) => Number.isFinite(line.amount) && line.amount > 0);

    if (normalizedPayments.length === 0) {
      setError("Дор хаяж нэг төлбөрийн дүн оруулна уу.");
      return;
    }

    if (paymentDifference !== 0) {
      setError("Төлбөрийн нийлбэр борлуулалтын дүнтэй яг тэнцүү байх ёстой.");
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
        err instanceof Error ? err.message : "Борлуулалт үүсгэж чадсангүй.",
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
    <div className="space-y-6">
      <section className="workspace-hero rounded-[34px] px-5 py-6 sm:px-7">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="metric-tile rounded-[24px] p-4">
            <p className="text-sm text-muted-foreground">Баталгаажсан орлого</p>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {formatCents(completedRevenue)}
            </div>
          </div>
          <div className="metric-tile rounded-[24px] p-4">
            <p className="text-sm text-muted-foreground">Зарагдсан тоо</p>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {unitsSold}
            </div>
          </div>
          <div className="metric-tile rounded-[24px] p-4">
            <p className="text-sm text-muted-foreground">Нээлттэй каталог</p>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {availableItems.length}
            </div>
          </div>
          <div className="metric-tile rounded-[24px] p-4">
            <p className="text-sm text-muted-foreground">
              Цуцлагдсан борлуулалт
            </p>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {canceledSales}
            </div>
          </div>
        </div>
      </section>

      <section className="toolbar-surface flex flex-wrap items-center justify-between gap-4 rounded-[28px] p-4">
        <div>
          <div className="section-kicker">Үйлдэл</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Шинэ борлуулалт үүсгэхийн өмнө төлбөрийн дүнгээ бүрэн тааруулна уу.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="rounded-full px-5">
          + Борлуулалт нэмэх
        </Button>
      </section>

      <section className="table-surface rounded-[30px]">
        <div className="flex items-center justify-between gap-4 border-b soft-divider px-5 py-4">
          <div>
            <div className="section-kicker">Бүртгэлийн түүх</div>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">
              Сүүлийн борлуулалт
            </h3>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <Layers3 className="h-4 w-4" />
            Сүүлийн 100 гүйлгээг харуулж байна
          </div>
        </div>

        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead>Д/д</TableHead>
              <TableHead>Огноо</TableHead>
              <TableHead>Бараа</TableHead>
              <TableHead>Дүн</TableHead>
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
                  className="py-12 text-center text-muted-foreground">
                  Борлуулалтын бүртгэл алга
                </TableCell>
              </TableRow>
            ) : (
              initialSales.map((sale) => {
                const saleItemsLabel = sale.items
                  .map((item) => `${item.item.name} x${item.qty}`)
                  .join(", ");

                return (
                  <TableRow key={sale.id} className="glass-row border-white/20">
                    <TableCell className="text-sm text-foreground/70">
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
                      {sale.status === "COMPLETED" ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-full"
                          onClick={() => setCancelId(sale.id)}>
                          Цуцлах
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </section>

      <Dialog open={createOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="glass-dialog min-w-2xl rounded-[32px] border-white/60">
          <DialogHeader>
            <DialogTitle className="display-title text-3xl">
              Шинэ борлуулалт
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSale} className="space-y-4">
            <Card className="panel-surface rounded-[28px] border-white/30 bg-white/5">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Сагс</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Төлбөр хуваахаас өмнө нэг эсвэл хэд хэдэн бараа нэмнэ үү.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLine}>
                  + Мөр нэмэх
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {draftLines.map((line, index) => {
                  const selectedIds = draftLines
                    .filter(
                      (entry) => entry.key !== line.key && entry.itemId !== "",
                    )
                    .map((entry) => entry.itemId);

                  return (
                    <div
                      key={line.key}
                      className="grid grid-cols-[minmax(0,1fr)_96px_88px] gap-2 rounded-[22px] border border-white/50 bg-white/50 p-3">
                      <div className="space-y-1">
                        <Label>Бараа {index + 1}</Label>
                        <Select
                          value={line.itemId}
                          onValueChange={(value) =>
                            updateLine(line.key, { itemId: value })
                          }>
                          <SelectTrigger>
                            <SelectValue placeholder="Бараа сонгох..." />
                          </SelectTrigger>
                          <SelectContent className="glass-dialog">
                            {availableItems.map((item) => (
                              <SelectItem
                                key={item.id}
                                value={item.id.toString()}
                                disabled={selectedIds.includes(
                                  item.id.toString(),
                                )}>
                                {item.name} - {formatCents(item.sellingPrice)}{" "}
                                (нөөц: {item.stockQty})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Тоо</Label>
                        <Input
                          type="number"
                          min="1"
                          value={line.qty}
                          onChange={(e) =>
                            updateLine(line.key, { qty: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full text-destructive"
                          onClick={() => removeLine(line.key)}>
                          Хасах
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {cart.length > 0 ? (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      {cart.map((line) => (
                        <div
                          key={line.key}
                          className="flex items-center justify-between rounded-[20px] bg-muted/40 px-3 py-3 text-sm">
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
                              Нөөц: {line.stockQty}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="flex justify-between px-2 text-sm font-semibold">
                      <span>Нийт дүн</span>
                      <span>{formatCents(cartTotal)}</span>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            <Card className="panel-surface rounded-[28px] border-white/30 bg-white/5">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Төлбөрийн хуваалт</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Төлбөрийн нийлбэрийг борлуулалтын дүнтэй яг тэнцүүлнэ үү.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPaymentLine}>
                  + Төлбөр нэмэх
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayPaymentLines.map((line, index) => {
                  const selectedMethods = displayPaymentLines
                    .filter((entry) => entry.key !== line.key)
                    .map((entry) => entry.method);

                  return (
                    <div
                      key={line.key}
                      className="grid grid-cols-[minmax(0,1fr)_120px_120px_88px] gap-2 rounded-[22px] border border-white/50 bg-white/50 p-3">
                      <div className="space-y-1">
                        <Label>Төлбөр {index + 1}</Label>
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
                          <SelectContent className="glass-dialog">
                            {paymentMethodOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                disabled={selectedMethods.includes(
                                  option.value,
                                )}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Дүн</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={line.amount}
                          onChange={(e) =>
                            updatePaymentLine(line.key, {
                              amount: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => fillRemainingAmount(line.key)}>
                          Үлдэгдэл дүүргэх
                        </Button>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full text-destructive"
                          onClick={() => removePaymentLine(line.key)}>
                          Хасах
                        </Button>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between rounded-[20px] bg-muted/40 px-3 py-3 text-sm">
                  <span>Оруулсан төлбөр</span>
                  <span>{formatCents(paymentTotal)}</span>
                </div>
                <div className="flex items-center justify-between rounded-[20px] border border-white/50 px-3 py-3 text-sm">
                  <span>Үлдэгдэл</span>
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
              <Label>Тэмдэглэл (заавал биш)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>

            {error ? (
              <p className="rounded-[18px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}>
                Хаах
              </Button>
              <Button type="submit" disabled={loading || cart.length === 0}>
                {loading
                  ? "Хадгалж байна..."
                  : `Борлуулалт үүсгэх (${formatCents(cartTotal)})`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}>
        <DialogContent className="glass-dialog rounded-[30px] border-white/60">
          <DialogHeader>
            <DialogTitle className="display-title text-3xl">
              #{cancelId} борлуулалтыг цуцлах
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Энэ үйлдэл нь борлуулалтыг цуцалж, холбогдсон бүх нөөцийг буцаан
            нэмнэ. Буцааж сэргээх боломжгүй.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCancelId(null)}>
              Буцах
            </Button>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={handleCancel}>
              {loading ? "Цуцалж байна..." : "Борлуулалт цуцлах"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
