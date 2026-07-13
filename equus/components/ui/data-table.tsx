"use client";

import { useState, useMemo, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ColumnDef<T> = {
  id: string;
  header: string;
  accessorFn: (row: T) => string | number | ReactNode;
  sortable?: boolean;
  filterable?: boolean;
};

export type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  pageSize?: number;
  filterPlaceholder?: string;
  emptyMessage?: string;
  onRowAction?: (row: T) => ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  data,
  pageSize = 10,
  filterPlaceholder = "Filter...",
  emptyMessage = "No results.",
  onRowAction,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(0);

  const filterableColumns = useMemo(
    () => columns.filter((c) => c.filterable),
    [columns],
  );

  const filtered = useMemo(() => {
    if (!filter.trim()) return data;
    const lower = filter.toLowerCase();
    return data.filter((row) =>
      filterableColumns.some((col) => {
        const val = col.accessorFn(row);
        return String(val).toLowerCase().includes(lower);
      }),
    );
  }, [data, filter, filterableColumns]);

  const sorted = useMemo(() => {
    if (!sortColumn) return filtered;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = col.accessorFn(a);
      const bVal = col.accessorFn(b);
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortColumn, sortDirection, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  function handleSort(columnId: string) {
    if (sortColumn === columnId) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  }

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {filterableColumns.length > 0 && (
        <Input
          placeholder={filterPlaceholder}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(col.sortable && "cursor-pointer select-none")}
                  onClick={() => col.sortable && handleSort(col.id)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <>
                        {sortColumn === col.id ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />
                        )}
                      </>
                    )}
                  </span>
                </TableHead>
              ))}
              {onRowAction && <TableHead className="w-0" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (onRowAction ? 1 : 0)} className="text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell key={col.id}>{col.accessorFn(row)}</TableCell>
                  ))}
                  {onRowAction && (
                    <TableCell className="text-right">{onRowAction(row)}</TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {safePage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
