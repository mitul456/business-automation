import React, { useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table';
import { Input } from './Input';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from './utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: keyof T;
  searchPlaceholder?: string;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Filter records...',
  pageSize = 10,
  className,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = React.useMemo(() => {
    if (!searchKey || !searchTerm) return data;
    return data.filter((item) => {
      const val = item[searchKey];
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchKey, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className={cn('space-y-3', className)}>
      {searchKey && (
        <div className="flex items-center justify-between">
          <div className="w-72">
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              leftIcon={<Search className="w-4 h-4" />}
              inputSize="sm"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Showing {filteredData.length} records
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <TableRow key={rowIdx}>
                  {columns.map((col, colIdx) => (
                    <TableCell key={colIdx} className={col.className}>
                      {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] ?? '') : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="text-center py-8 text-slate-400" colSpan={columns.length}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <div className="text-xs text-slate-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
