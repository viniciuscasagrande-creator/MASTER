import React from 'react';
import { cn } from '../utils/cn';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T, index: number) => React.ReactNode);
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (item: T) => void;
  className?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  emptyIcon,
  onRowClick,
  className,
  pagination
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn('w-full overflow-hidden rounded-xl border border-slate-800 bg-[#0F172A] shadow-sm', className)}>
        <div className="p-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mb-2" />
          <p className="text-xs font-medium text-slate-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-hidden rounded-xl border border-slate-800 bg-[#0F172A] shadow-sm text-white', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-200">
          <thead className="border-b border-slate-800 bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'py-3 px-4 font-semibold select-none',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-10 px-4 text-center text-slate-400">
                  {emptyIcon && <div className="mb-2 flex justify-center text-slate-500">{emptyIcon}</div>}
                  <p className="text-xs font-medium">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => {
                const isClickable = Boolean(onRowClick);
                return (
                  <tr
                    key={keyExtractor(item, rowIdx)}
                    onClick={() => isClickable && onRowClick?.(item)}
                    className={cn(
                      'transition-colors duration-150',
                      isClickable ? 'cursor-pointer hover:bg-slate-800/80' : 'hover:bg-slate-800/40'
                    )}
                  >
                    {columns.map((col, colIdx) => {
                      let cellContent: React.ReactNode = null;
                      if (typeof col.accessor === 'function') {
                        cellContent = col.accessor(item, rowIdx);
                      } else if (col.accessor) {
                        cellContent = item[col.accessor] as unknown as React.ReactNode;
                      }

                      return (
                        <td
                          key={colIdx}
                          className={cn(
                            'py-3 px-4',
                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                            col.className
                          )}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2.5 text-xs text-slate-400">
          <div>
            {pagination.totalItems !== undefined && (
              <span>Total de <strong className="text-white">{pagination.totalItems}</strong> registros</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Anterior
            </button>
            <span className="px-2 text-xs font-semibold text-white">
              {pagination.currentPage} de {pagination.totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
