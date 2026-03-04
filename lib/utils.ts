import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('mn-MN').format(date)
}

export function parseToCents(str: string): number {
  const num = parseFloat(str.replace(/[^0-9.-]/g, ''))
  if (isNaN(num)) return 0
  return Math.round(num * 100)
}

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}
