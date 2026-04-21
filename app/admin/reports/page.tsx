import { ReportsView } from '@/components/admin/reports-view'
import { getReportData } from '@/app/admin/reports/actions'
import { startOfMonth } from '@/lib/utils'

export default async function ReportsPage() {
  const now = new Date()
  const initialDateRange = {
    from: startOfMonth(now),
    to: now,
  }
  const initialData = await getReportData(initialDateRange.from, initialDateRange.to)

  return <ReportsView initialData={initialData} initialDateRange={initialDateRange} />
}
