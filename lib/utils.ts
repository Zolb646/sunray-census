import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency: 'MNT',
  }).format(cents)
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('mn-MN').format(date)
}

export function parseToCents(str: string): number {
  const num = parseFloat(str.replace(/[^0-9.-]/g, ''))
  if (isNaN(num)) return 0
  return Math.round(num)
}

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function startOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

