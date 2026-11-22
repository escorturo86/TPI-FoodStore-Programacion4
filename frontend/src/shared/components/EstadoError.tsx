export function EstadoError({ mensaje }: { mensaje: string }) {
  return <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{mensaje}</p>
}
