export function Skeleton() {
  return <div role="status" aria-label="Cargando productos" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 4 }, (_, indice) => <div key={indice} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
      <div className="h-40 rounded bg-slate-200" />
      <div className="mt-4 h-5 w-2/3 rounded bg-slate-200" />
      <div className="mt-3 h-4 w-1/3 rounded bg-slate-200" />
    </div>)}
  </div>
}
