import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'

export function TablaAdmin<T>({ datos, columnas }: { datos: T[], columnas: ColumnDef<T, unknown>[] }) {
  const tabla = useReactTable({ data: datos, columns: columnas, getCoreRowModel: getCoreRowModel() })
  return <div>
    <p className="mb-2 text-xs text-slate-600 sm:hidden">Deslizá la tabla para ver todas las columnas.</p>
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
    <table className="w-full min-w-[680px] text-left text-sm">
      <thead className="bg-slate-100 text-slate-700">{tabla.getHeaderGroups().map((grupo) => <tr key={grupo.id}>
        {grupo.headers.map((celda) => <th key={celda.id} className="px-4 py-3 font-semibold">
          {flexRender(celda.column.columnDef.header, celda.getContext())}</th>)}
      </tr>)}</thead>
      <tbody>{tabla.getRowModel().rows.map((fila) => <tr key={fila.id} className="border-t border-slate-100">
        {fila.getVisibleCells().map((celda) => <td key={celda.id} className="px-4 py-3 align-top">
          {flexRender(celda.column.columnDef.cell, celda.getContext())}</td>)}
      </tr>)}</tbody>
    </table>
    </div>
  </div>
}
