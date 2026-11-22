import type { ReactNode } from 'react'

export function EstadoVacio({ mensaje, children }: { mensaje: string, children?: ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
    <p>{mensaje}</p>
    {children}
  </div>
}
