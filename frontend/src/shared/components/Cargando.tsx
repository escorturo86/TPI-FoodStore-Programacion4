export function Cargando({ mensaje = 'Cargando...' }: { mensaje?: string }) {
  return <p className="py-12 text-center text-slate-600" role="status">{mensaje}</p>
}
