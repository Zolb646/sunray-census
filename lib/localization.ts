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
  { value: 'UTILITIES', label: 'Тог, ус' },
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
  { value: 'CASH', label: 'Бэлэн мөнгө' },
  { value: 'CARD', label: 'Карт' },
  { value: 'TRANSFER', label: 'Шилжүүлэг' },
  { value: 'OTHER', label: 'Бусад' },
]

const paymentMethodLabels = Object.fromEntries(
  paymentMethodOptions.map((option) => [option.value, option.label])
) as Record<string, string>

export function getPaymentMethodLabel(value: PaymentMethod | string) {
  return paymentMethodLabels[value] ?? value
}

export const saleStatusLabels: Record<SaleStatus, string> = {
  COMPLETED: 'Дууссан',
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
