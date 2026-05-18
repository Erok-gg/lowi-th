import ComingSoon from '@/app/(dashboard)/_components/ComingSoon'

export default function BinPage() {
  return (
    <ComingSoon
      icon="🗑️"
      title="Bin"
      description="Deleted items with 30-day retention before permanent purge. Restore or delete forever from here."
      sprintRef="V2 — Recycle bin"
    />
  )
}
