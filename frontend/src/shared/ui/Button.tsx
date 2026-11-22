import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'principal' | 'secundaria'
}

export function Button({ variante = 'principal', className = '', ...props }: Props) {
  const estilo = variante === 'principal'
    ? 'bg-emerald-700 text-white hover:bg-emerald-800'
    : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100'

  return (
    <button
      className={`rounded-lg px-4 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${estilo} ${className}`}
      {...props}
    />
  )
}
