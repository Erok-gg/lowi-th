import { redirect } from 'next/navigation'
export default function ApprovedPage() { redirect('/submissions/kyc?status=approved') }
