import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils'
import DevelopmentClient from './client'

export default async function DevelopmentPage() {
  const user = await requireAuth(AuthPresets.requireDevelopment);
  return <DevelopmentClient user={user} />
}