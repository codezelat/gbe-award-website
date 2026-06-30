import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  Award as AwardIcon,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  Search,
  Trash2,
  Trophy as TrophyIcon,
} from "lucide-react";
import AdminForm, { blankForm, rowToForm } from "./AdminForm";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  SelectField,
  ToastProvider,
  cn,
  formatDate,
  initials,
  personName,
  statusBadgeVariant,
  useToast,
  type ApiList,
  type ContentKind,
  type FormState,
  type RowRecord,
} from "./ui";

type Row = RowRecord;

function useDebounced<T>(fn: (value: string) => void, delay = 240) {
  const ref = useMemo(() => {
    let timer: number | undefined;
    return (value: string) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(value), delay);
    };
  }, [fn, delay]);
  return ref;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-white/[0.04]">
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="size-10 shrink-0 animate-pulse rounded-lg bg-white/[0.04]" />
              <div className="space-y-2">
                <div className="h-3 w-40 animate-pulse rounded bg-white/[0.05]" />
                <div className="h-2.5 w-24 animate-pulse rounded bg-white/[0.03]" />
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="h-3 w-28 animate-pulse rounded bg-white/[0.04]" />
          </td>
          <td className="px-4 py-4">
            <div className="h-3 w-10 animate-pulse rounded bg-white/[0.04]" />
          </td>
          <td className="px-4 py-4">
            <div className="h-5 w-20 animate-pulse rounded-full bg-white/[0.04]" />
          </td>
          <td className="px-4 py-4">
            <div className="flex justify-end gap-2">
              <div className="size-8 animate-pulse rounded-lg bg-white/[0.04]" />
              <div className="size-8 animate-pulse rounded-lg bg-white/[0.04]" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export default function ContentManager({ kind }: { kind: ContentKind }) {
  return (
    <ToastProvider>
      <ContentManagerInner kind={kind} />
    </ToastProvider>
  );
}

function ContentManagerInner({ kind }: { kind: ContentKind }) {
  const { showToast } = useToast();
  const isWinner = kind === "winners";
  const [list, setList] = useState<ApiList<Row>>({
    rows: [],
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  const statusOptions = isWinner
    ? [
        { value: "all", label: "All statuses" },
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
        { value: "archived", label: "Archived" },
      ]
    : [
        { value: "all", label: "All statuses" },
        { value: "draft", label: "Draft" },
        { value: "submitted", label: "Submitted" },
        { value: "shortlisted", label: "Shortlisted" },
        { value: "published", label: "Published" },
        { value: "archived", label: "Archived" },
      ];

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
      q,
      status,
    });
    try {
      const res = await fetch(
        `/api/gbe-admin-safe/${kind}?${params.toString()}`,
        { cache: "no-store" },
      );
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      if (!res.ok) throw new Error("Failed to load records.");
      const data = (await res.json()) as ApiList<Row>;
      setList(data);
    } catch (err) {
      showToast({
        title: "Could not load records",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [kind, page, q, status, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const debouncedSearch = useDebounced((value: string) => {
    setQ(value);
    setPage(1);
  });

  async function handleDelete(row: Row) {
    const name = personName(kind, row);
    setDeleting(true);
    try {
      const res = await fetch(`/api/gbe-admin-safe/${kind}/${row.id}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      if (!res.ok) throw new Error();
      showToast({
        title: "Record deleted",
        description: `${name} was removed.`,
        variant: "success",
      });
      setPendingDelete(null);
      await load();
    } catch {
      showToast({ title: "Delete failed", variant: "error" });
    } finally {
      setDeleting(false);
    }
  }

  const config = isWinner
    ? { title: "Past winners", singular: "winner", emptyIcon: TrophyIcon }
    : { title: "Nominations", singular: "nomination", emptyIcon: AwardIcon };

  return (
    <div className="space-y-5">
      {/* Heading + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-50">
            {config.title}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {loading
              ? "Loading records..."
              : `${list.total} ${list.total === 1 ? "record" : "records"} total`}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setEditing(blankForm(kind))}
        >
          Add {config.singular}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
            <input
              className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0e0e11] pl-10 pr-3.5 text-[15px] text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-[#ffb001]/55 focus:ring-2 focus:ring-[#ffb001]/18"
              placeholder={isWinner ? "Search title, name, or category..." : "Search title, name, category, or market..."}
              onChange={(e) => debouncedSearch(e.target.value)}
            />
        </div>
        <div className="w-full sm:w-[180px]">
          <SelectField
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={statusOptions}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#101013]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3.5">Recipient</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Year</th>
                <th className="px-4 py-3.5">Updated</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <SkeletonRows />
              ) : list.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={config.emptyIcon}
                      title={`No ${config.title.toLowerCase()} yet`}
                      description={
                        q || status !== "all"
                          ? "No records match your filters. Try adjusting your search."
                          : `Get started by creating your first ${config.singular}.`
                      }
                      action={
                        !q && status === "all" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Plus}
                            onClick={() => setEditing(blankForm(kind))}
                          >
                            Add {config.singular}
                          </Button>
                        ) : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                list.rows.map((row) => {
                  const name = personName(kind, row);
                  return (
                    <tr
                      key={row.id}
                      className="group transition-colors hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1e] ring-1 ring-inset ring-white/[0.06]">
                            {row.imageUrl ? (
                              <img
                                src={row.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="grid size-full place-items-center bg-gradient-to-br from-[#1f1f24] to-[#161619] text-xs font-bold text-[#ffd05a]/70">
                                {initials(name)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-zinc-100">
                              {name}
                            </p>
                            <p className="truncate text-[13px] text-zinc-500">
                              {row.awardTitle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-sm text-zinc-300">{row.category}</div>
                        {!isWinner ? <div className="text-[12px] text-zinc-600">{row.market}</div> : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-sm text-zinc-400">
                          {row.year}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-zinc-500">
                        {formatDate(row.updatedAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={statusBadgeVariant(row.status)}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <button
                            className="grid size-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-100"
                            onClick={() => setEditing(rowToForm(kind, row))}
                            aria-label={`Edit ${name}`}
                            type="button"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            className="grid size-8 place-items-center rounded-lg text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                            onClick={() => setPendingDelete(row)}
                            aria-label={`Delete ${name}`}
                            type="button"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && list.rows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3.5">
            <p className="text-[13px] text-zinc-500">
              Page <span className="font-semibold text-zinc-300">{list.page}</span> of{" "}
              <span className="font-semibold text-zinc-300">{list.pages}</span>
              <span className="mx-2 text-zinc-700">&middot;</span>
              {list.total} total
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
                className="flex-row-reverse"
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronRight}
                disabled={page >= list.pages}
                onClick={() => setPage((p) => p + 1)}
                type="button"
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {editing ? (
          <AdminForm
            key={editing.id ?? "new"}
            kind={kind}
            editing={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              void load();
            }}
            showToast={showToast}
          />
        ) : null}
      </AnimatePresence>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${config.singular}?`}
        description={
          pendingDelete
            ? `Delete "${personName(kind, pendingDelete)}" permanently. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete record"
        cancelLabel="Keep record"
        tone="danger"
        pending={deleting}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete) {
            void handleDelete(pendingDelete);
          }
        }}
      />
    </div>
  );
}
