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
  { value: 'Dress', label: 'Даашинз' },
  { value: 'Top', label: 'Цамц' },
  { value: 'Pants', label: 'Өмд' },
  { value: 'Skirt', label: 'Юбка' },
  { value: 'Outerwear', label: 'Гадуур хувцас' },
  { value: 'Other', label: 'Бусад' },
]

const inventoryCategoryLabels = Object.fromEntries(
  inventoryCategoryOptions.map((option) => [option.value, option.label])
) as Record<string, string>

export function getInventoryCategoryLabel(value: string) {
  return inventoryCategoryLabels[value] ?? value
}

export const expenseCategoryOptions: Option<ExpenseCategory>[] = [
  { value: 'RENT', label: 'Түрээс' },
  { value: 'UTILITIES', label: 'Ашиглалтын зардал' },
  { value: 'SUPPLIES', label: 'Хангамж' },
  { value: 'MARKETING', label: 'Маркетинг' },
  { value: 'SALARY', label: 'Цалин' },
  { value: 'OTHER', label: 'Бусад' },
]

const expenseCategoryLabels = Object.fromEntries(
  expenseCategoryOptions.map((option) => [option.value, option.label])
) as Record<string, string>

export function getExpenseCategoryLabel(value: ExpenseCategory | string) {
  return expenseCategoryLabels[value] ?? value
}

export const paymentMethodOptions: Option<PaymentMethod>[] = [
  { value: 'CASH', label: 'Бэлэн' },
  { value: 'CARD', label: 'Карт' },
  { value: 'TRANSFER', label: 'Дансны шилжүүлэг' },
  { value: 'QPAY', label: 'QPay' },
  { value: 'OTHER', label: 'Бусад' },
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
  COMPLETED: 'Баталгаажсан',
  CANCELED: 'Цуцлагдсан',
  REFUNDED: 'Буцаасан',
}

export function getSaleStatusLabel(value: SaleStatus | string) {
  return saleStatusLabels[value as SaleStatus] ?? value
}

export const stockReasonOptions: Array<{
  value: StockReason
  label: string
  sign: 1 | -1
}> = [
  { value: 'RESTOCK', label: 'Нөөц нэмэх (+)', sign: 1 },
  { value: 'ADJUSTMENT', label: 'Тохируулга (+/-)', sign: 1 },
  { value: 'DAMAGE', label: 'Гэмтэл (-)', sign: -1 },
  { value: 'LOSS', label: 'Хорогдол (-)', sign: -1 },
]
