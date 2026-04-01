import React, { useState } from 'react'

export default function DataTable({ columns, data, onRowClick, rowKey = 'id' }) {
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const sorted = sortCol ? [...data].sort((a, b) => {
    const va = a[sortCol], vb = b[sortCol]
    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))
    return sortDir === 'asc' ? cmp : -cmp
  }) : data

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border">
            {columns.map(c => (
              <th key={c.key} onClick={() => c.sortable !== false && toggleSort(c.key)}
                className={`text-left text-[11px] text-muted tracking-[0.05em] uppercase font-medium py-2 pr-4 ${c.sortable !== false ? 'cursor-pointer select-none' : ''} ${c.align === 'right' ? 'text-right' : ''}`}>
                {c.label} {sortCol === c.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(row => (
            <tr key={row[rowKey]} onClick={() => onRowClick?.(row)}
              className={`border-b border-border/50 hover:bg-surface ${onRowClick ? 'cursor-pointer' : ''}`}>
              {columns.map(c => (
                <td key={c.key} className={`py-2 pr-4 ${c.mono ? 'font-mono' : ''} ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr><td colSpan={columns.length} className="py-12 text-center text-muted">No data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
