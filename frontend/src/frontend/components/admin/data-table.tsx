import { useMemo, useState, type ReactNode } from "react";
import { downloadCsv, EmptyState, TableSkeleton } from "@/frontend/components/admin/shell";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  csv?: (row: T) => string | number;
  className?: string;
};

/** Searchable, paginated table used across the admin pages. */
export function DataTable<T extends { id?: string }>({
  rows,
  columns,
  loading,
  searchKeys,
  searchPlaceholder = "Search",
  csvName,
  empty = "Nothing here yet",
  pageSize = 20,
  toolbar,
}: {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchKeys?: (row: T) => (string | null | undefined)[];
  searchPlaceholder?: string;
  csvName?: string;
  empty?: string;
  pageSize?: number;
  toolbar?: ReactNode;
}) {
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t || !searchKeys) return rows;
    return rows.filter((r) =>
      searchKeys(r)
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t)),
    );
  }, [rows, term, searchKeys]);

  const slice = filtered.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <Card className="p-2">
      {(searchKeys || toolbar || csvName) && (
        <div className="flex flex-wrap items-center gap-2 p-2">
          {searchKeys && (
            <Input
              value={term}
              onChange={(e) => {
                setTerm(e.target.value);
                setPage(0);
              }}
              placeholder={searchPlaceholder}
              className="w-full sm:w-72"
            />
          )}
          {toolbar}
          {csvName && (
            <Button
              variant="outline"
              size="sm"
              className="ms-auto"
              onClick={() =>
                downloadCsv(
                  csvName,
                  filtered.map((r) =>
                    Object.fromEntries(
                      columns.filter((c) => c.csv).map((c) => [c.header, c.csv!(r)]),
                    ),
                  ),
                )
              }
            >
              Export CSV
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={8} />
      ) : filtered.length ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key} className={c.className}>
                    {c.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {slice.map((row, i) => (
                <TableRow key={row.id ?? i}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length > pageSize && (
            <div className="flex items-center justify-between p-3 text-sm text-muted-foreground">
              <span>
                {page * pageSize + 1}–{Math.min(filtered.length, (page + 1) * pageSize)} of{" "}
                {filtered.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * pageSize >= filtered.length}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState title={empty} />
      )}
    </Card>
  );
}
