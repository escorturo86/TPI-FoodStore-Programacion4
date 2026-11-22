import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta: string
  error?: string
}

export function Input({ etiqueta, error, id, className = '', ...props }: Props) {
  return (
    <label htmlFor={id} className="block space-y-1 text-sm font-medium text-slate-700">
      <span>{etiqueta}</span>
      <input
        id={id}
        className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ${className}`}
        {...props}
      />
      {error && <span className="block text-sm text-red-700">{error}</span>}
    </label>
  )
}
