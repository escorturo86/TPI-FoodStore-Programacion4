import type { ReactNode } from 'react'
import { AdminNav } from './AdminNav'

export function AdminPage({ titulo, children }: { titulo: string, children: ReactNode }) {
  return <div className="space-y-5">
    <h1 className="text-3xl font-bold">{titulo}</h1>
    <AdminNav />
    {children}
  </div>
}
