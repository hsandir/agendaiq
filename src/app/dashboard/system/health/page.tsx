import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils'
import HealthClient from './client'

export default async function HealthPage() {
  const user = await requireAuth(AuthPresets.requireMonitoring)
  
  return <HealthClient user={user} />
} 