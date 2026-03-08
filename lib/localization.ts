import type {
  ExpenseCategory,
  PaymentMethod,
  SaleStatus,
  StockReason,
} from '@prisma/client'

type Option<T extends string> = {
  value: T
  label: string
}

export type PaymentBreakdownEntry = {
  method: PaymentMethod
  amount: number
}

export const inventoryCategoryOptions: Option<string>[] = [
  { value: 'Dress', label: 'Dress' },
  { value: 'Top', label: 'Top' },
  { value: 'Pants', label: 'Pants' },
  { value: 'Skirt', label: 'Skirt' },
  { value: 'Outerwear', label: 'Outerwear' },
  { value: 'Other', label: 'Other' },
]

const inventoryCategoryLabels = Object.fromEntries(
  inventoryCategoryOptions.map((option) => [option.value, option.label])
) as Record<string, string>

export function getInventoryCategoryLabel(value: string) {
  return inventoryCategoryLabels[value] ?? value
}

export const expenseCategoryOptions: Option<ExpenseCategory>[] = [
  { value: 'RENT', label: 'Rent' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'SUPPLIES', label: 'Supplies' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SALARY', label: 'Salary' },
  { value: 'OTHER', label: 'Other' },
]

const expenseCategoryLabels = Object.fromEntries(
  expenseCategoryOptions.map((option) => [option.value, option.label])
) as Record<string, string>

export function getExpenseCategoryLabel(value: ExpenseCategory | string) {
  return expenseCategoryLabels[value] ?? value
}

export const paymentMethodOptions: Option<PaymentMethod>[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'TRANSFER', label: 'Bank Transfer' },
  { value: 'QPAY', label: 'QPay' },
  { value: 'OTHER', label: 'Other' },
]

const paymentMethodLabels = Object.fromEntries(
  paymentMethodOptions.map((option) => [option.value, option.label])
) as Record<string, string>

export function getPaymentMethodLabel(value: PaymentMethod | string) {
  return paymentMethodLabels[value] ?? value
}

export function normalizePaymentBreakdown(
  value: unknown,
): PaymentBreakdownEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return []
    }

    const method = 'method' in entry ? entry.method : undefined
    const amount = 'amount' in entry ? entry.amount : undefined

    if (typeof method !== 'string') {
      return []
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return []
    }

    return [{ method: method as PaymentMethod, amount }]
  })
}

export function formatPaymentBreakdown(
  value: unknown,
  fallback?: PaymentMethod | string,
) {
  const breakdown = normalizePaymentBreakdown(value)

  if (breakdown.length === 0) {
    return fallback ? getPaymentMethodLabel(fallback) : '-'
  }

  return breakdown
    .map((entry) => `${getPaymentMethodLabel(entry.method)} ${entry.amount}`)
    .join(' + ')
}

export const saleStatusLabels: Record<SaleStatus, string> = {
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
  REFUNDED: 'Refunded',
}

export function getSaleStatusLabel(value: SaleStatus | string) {
  return saleStatusLabels[value as SaleStatus] ?? value
}

export const stockReasonOptions: Array<{
  value: StockReason
  label: string
  sign: 1 | -1
}> = [
  { value: 'RESTOCK', label: 'Restock (+)', sign: 1 },
  { value: 'ADJUSTMENT', label: 'Adjustment (+/-)', sign: 1 },
  { value: 'DAMAGE', label: 'Damage (-)', sign: -1 },
  { value: 'LOSS', label: 'Loss (-)', sign: -1 },
]