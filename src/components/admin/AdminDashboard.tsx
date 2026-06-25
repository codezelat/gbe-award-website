import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  UploadCloud,
  X,
} from "lucide-react";

type Tab = "winners" | "nominations";
type Stats = {
  winners: { total: number; published: number; draft: number };
  nominations: { total: number; shortlisted: number; submitted: number };
};

type WinnerRow = {
  id: string;
  awardTitle: string;
  recipientName: string;
  organization: string | null;
  category: string;
  year: number;
  market: string;
  summary: string;
  imageUrl: string | null;
  slug: string;
  status: "draft" | "published" | "archived";
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

type NominationRow = {
  id: string;
  awardTitle: string;
  nomineeName: string;
  organization: string | null;
  category: string;
  year: number;
  market: string;
  summary: string;
  notes: string;
  imageUrl: string | null;
  slug: string;
  status: "draft" | "submitted" | "shortlisted" | "published" | "archived";
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

type ApiList<T> = {
  rows: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

type FormState = {
  id?: string;
  awardTitle: string;
  personName: string;
  organization: string;
  category: string;
  year: string;
  market: string;
  summary: string;
  notes: string;
  imageUrl: string;
  slug: string;
  status: string;
  sortOrder: string;
  seoTitle: string;
  seoDescription: string;
};

const blankForm = (tab: Tab): FormState => ({
  awardTitle: "",
  personName: "",
  organization: "",
  category: "",
  year: "2026",
  market: "International",
  summary: "",
  notes: "",
  imageUrl: "",
  slug: "",
  status: tab === "winners" ? "draft" : "submitted",
  sortOrder: "0",
  seoTitle: "",
  seoDescription: "",
});

function rowToForm(tab: Tab, row: WinnerRow | NominationRow): FormState {
  const personName = tab === "winners" ? (row as WinnerRow).recipientName : (row as NominationRow).nomineeName;
  return {
    id: row.id,
    awardTitle: row.awardTitle,
    personName,
    organization: row.organization ?? "",
    category: row.category,
    year: String(row.year),
    market: row.market,
    summary: row.summary,
    notes: tab === "nominations" ? (row as NominationRow).notes : "",
    imageUrl: row.imageUrl ?? "",
    slug: row.slug,
    status: row.status,
    sortOrder: String(row.sortOrder),
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
  };
}

function statusClasses(status: string) {
  if (status === "published" || status === "shortlisted") return "border-emerald-400/35 bg-emerald-400/10 text-emerald-100";
  if (status === "submitted") return "border-sky-400/35 bg-sky-400/10 text-sky-100";
  if (status === "archived") return "border-white/15 bg-white/5 text-gbe-muted";
  return "border-gbe-gold/25 bg-gbe-gold/10 text-gbe-gold-bright";
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-gbe-text/82">
      {label}
      <input
        className="min-h-12 rounded-lg border border-white/10 bg-black/45 px-4 text-base font-medium text-gbe-text outline-none transition focus:border-gbe-gold/70"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        required={required}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-gbe-text/82">
      {label}
      <textarea
        className="min-h-24 resize-y rounded-lg border border-white/10 bg-black/45 px-4 py-3 text-base font-medium leading-relaxed text-gbe-text outline-none transition focus:border-gbe-gold/70"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-gbe-text/82">
      {label}
      <select
        className="min-h-12 rounded-lg border border-white/10 bg-black/45 px-4 text-base font-medium text-gbe-text outline-none transition focus:border-gbe-gold/70"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function AdminDashboard({ initialAuthed }: { initialAuthed: boolean }) {
  const [authed, setAuthed] = useState(initialAuthed);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("winners");
  const [stats, setStats] = useState<Stats | null>(null);
  const [winners, setWinners] = useState<ApiList<WinnerRow>>({ rows: [], page: 1, limit: 10, total: 0, pages: 1 });
  const [nominations, setNominations] = useState<ApiList<NominationRow>>({ rows: [], page: 1, limit: 10, total: 0, pages: 1 });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<FormState | null>(null);

  const activeList = tab === "winners" ? winners : nominations;
  const statusOptions = tab === "winners" ? ["all", "draft", "published", "archived"] : ["all", "draft", "submitted", "shortlisted", "published", "archived"];

  const loadData = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    setMessage("");
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
      q,
      status,
    });

    try {
      const [statsRes, listRes] = await Promise.all([
        fetch("/api/gbe-admin-safe/stats", { cache: "no-store" }),
        fetch(`/api/gbe-admin-safe/${tab}?${params.toString()}`, { cache: "no-store" }),
      ]);

      if (statsRes.status === 401 || listRes.status === 401) {
        setAuthed(false);
        return;
      }

      if (!statsRes.ok || !listRes.ok) throw new Error("Admin data could not be loaded.");

      setStats(await statsRes.json());
      const list = await listRes.json();
      if (tab === "winners") setWinners(list);
      else setNominations(list);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Admin data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [authed, page, q, status, tab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
    setStatus("all");
  }, [tab]);

  const debouncedSearch = useMemo(() => {
    let timeout: number | undefined;
    return (value: string) => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        setQ(value);
        setPage(1);
      }, 220);
    };
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe: true }),
      });

      if (!response.ok) throw new Error("Login failed. Check the admin email and password.");
      setAuthed(true);
      setPassword("");
      setPage(1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    setAuthed(false);
  }

  function openCreate() {
    setEditing(blankForm(tab));
    setMessage("");
  }

  function openEdit(row: WinnerRow | NominationRow) {
    setEditing(rowToForm(tab, row));
    setMessage("");
  }

  async function saveForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage("");

    const payload =
      tab === "winners"
        ? {
            awardTitle: editing.awardTitle,
            recipientName: editing.personName,
            organization: editing.organization,
            category: editing.category,
            year: editing.year,
            market: editing.market,
            summary: editing.summary,
            imageUrl: editing.imageUrl,
            slug: editing.slug,
            status: editing.status,
            sortOrder: editing.sortOrder,
            seoTitle: editing.seoTitle,
            seoDescription: editing.seoDescription,
          }
        : {
            awardTitle: editing.awardTitle,
            nomineeName: editing.personName,
            organization: editing.organization,
            category: editing.category,
            year: editing.year,
            market: editing.market,
            summary: editing.summary,
            notes: editing.notes,
            imageUrl: editing.imageUrl,
            slug: editing.slug,
            status: editing.status,
            sortOrder: editing.sortOrder,
            seoTitle: editing.seoTitle,
            seoDescription: editing.seoDescription,
          };

    const endpoint = editing.id ? `/api/gbe-admin-safe/${tab}/${editing.id}` : `/api/gbe-admin-safe/${tab}`;
    const response = await fetch(endpoint, {
      method: editing.id ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setMessage(body?.error ?? "Could not save. Please check the fields.");
      setSaving(false);
      return;
    }

    setEditing(null);
    setSaving(false);
    await loadData();
  }

  async function removeRow(row: WinnerRow | NominationRow) {
    const label = tab === "winners" ? (row as WinnerRow).recipientName : (row as NominationRow).nomineeName;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

    const response = await fetch(`/api/gbe-admin-safe/${tab}/${row.id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Could not delete this record.");
      return;
    }
    await loadData();
  }

  async function uploadImage(file: File | null) {
    if (!editing || !file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", tab);

    const response = await fetch("/api/gbe-admin-safe/upload", {
      method: "POST",
      body: formData,
    });

    const body = await response.json().catch(() => null);
    setUploading(false);

    if (!response.ok) {
      setMessage(body?.error ?? "Image upload failed.");
      return;
    }

    setEditing({ ...editing, imageUrl: body.url });
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-[var(--c-page-glow)] px-5 py-8 text-gbe-text">
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1120px] place-items-center">
          <div className="w-full max-w-[440px] rounded-2xl border border-gbe-gold/20 bg-black/70 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
            <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-full border border-gbe-gold/30 bg-gbe-gold/10 text-gbe-gold-bright">
              <Lock size={24} />
            </div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.22em] text-gbe-gold-bright">GBE admin</p>
            <h1 className="m-0 text-[clamp(32px,4vw,46px)] font-black leading-none text-gbe-text">Safe dashboard</h1>
            <p className="mb-7 mt-4 text-base font-medium leading-7 text-gbe-muted">Manage past winners and nominations with a protected admin session.</p>
            <form className="grid gap-4" onSubmit={login}>
              <TextField label="Admin email" value={email} onChange={setEmail} type="email" required />
              <TextField label="Password" value={password} onChange={setPassword} type="password" required />
              {message ? <p className="m-0 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100">{message}</p> : null}
              <button className="btn-gold btn-gold-hover mt-2 w-full" disabled={saving} type="submit">
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                Sign in
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--c-page-glow)] px-5 py-6 text-gbe-text">
      <section className="container-gbe">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gbe-gold/15 bg-black/55 px-5 py-4 backdrop-blur-xl">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-[0.22em] text-gbe-gold-bright">GBE Awards 2026</p>
            <h1 className="m-0 mt-1 text-[clamp(28px,3vw,42px)] font-black leading-tight">Admin dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-gbe-muted transition hover:border-gbe-gold/40 hover:text-gbe-text" href="/">
              View site
            </a>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm font-bold text-gbe-muted transition hover:border-gbe-gold/40 hover:text-gbe-text" onClick={logout} type="button">
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-4 max-[1024px]:grid-cols-2 max-[560px]:grid-cols-1">
          {[
            { label: "Past winners", value: stats?.winners.total ?? 0, detail: `${stats?.winners.published ?? 0} published`, icon: Trophy },
            { label: "Winner drafts", value: stats?.winners.draft ?? 0, detail: "Ready to polish", icon: Edit3 },
            { label: "Nominations", value: stats?.nominations.total ?? 0, detail: `${stats?.nominations.submitted ?? 0} submitted`, icon: Award },
            { label: "Shortlisted", value: stats?.nominations.shortlisted ?? 0, detail: "Priority follow-up", icon: Sparkles },
          ].map((item) => (
            <article key={item.label} className="rounded-xl border border-white/10 bg-black/45 p-5 shadow-[var(--c-card-shadow)]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-gbe-gold/20 bg-gbe-gold/10 text-gbe-gold-bright">
                <item.icon size={20} />
              </div>
              <p className="m-0 text-3xl font-black leading-none">{item.value}</p>
              <p className="mb-0 mt-2 text-sm font-bold uppercase tracking-[0.14em] text-gbe-muted">{item.label}</p>
              <p className="m-0 text-sm font-medium text-gbe-text/72">{item.detail}</p>
            </article>
          ))}
        </div>

        <section className="rounded-2xl border border-gbe-gold/15 bg-black/55 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
              {(["winners", "nominations"] as Tab[]).map((item) => (
                <button
                  key={item}
                  className={`min-h-10 rounded-full px-5 text-sm font-black uppercase tracking-[0.12em] transition ${tab === item ? "bg-gbe-gold text-black" : "text-gbe-muted hover:text-gbe-text"}`}
                  onClick={() => setTab(item)}
                  type="button"
                >
                  {item === "winners" ? "Past winners" : "Nominations"}
                </button>
              ))}
            </div>
            <button className="btn-gold btn-gold-hover min-h-11 px-5 text-sm" onClick={openCreate} type="button">
              <Plus size={17} />
              Add {tab === "winners" ? "winner" : "nomination"}
            </button>
          </div>

          <div className="mb-4 grid grid-cols-[minmax(220px,1fr)_220px] gap-3 max-[760px]:grid-cols-1">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gbe-muted" size={18} />
              <input
                className="min-h-12 w-full rounded-lg border border-white/10 bg-black/45 pl-11 pr-4 text-base font-medium text-gbe-text outline-none transition focus:border-gbe-gold/70"
                placeholder="Search title, name, category, market"
                onChange={(event) => debouncedSearch(event.target.value)}
              />
            </label>
            <select
              className="min-h-12 rounded-lg border border-white/10 bg-black/45 px-4 text-base font-bold text-gbe-text outline-none transition focus:border-gbe-gold/70"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All statuses" : item.charAt(0).toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {message ? <p className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100">{message}</p> : null}

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[900px] border-collapse bg-black/30">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs font-black uppercase tracking-[0.15em] text-gbe-muted">
                  <th className="px-4 py-4">Award</th>
                  <th className="px-4 py-4">{tab === "winners" ? "Winner" : "Nominee"}</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Year</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-12 text-center text-gbe-muted" colSpan={6}>
                      <Loader2 className="mx-auto mb-2 animate-spin" size={24} />
                      Loading fresh records
                    </td>
                  </tr>
                ) : activeList.rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-12 text-center text-gbe-muted" colSpan={6}>
                      No records found.
                    </td>
                  </tr>
                ) : (
                  activeList.rows.map((row) => {
                    const person = tab === "winners" ? (row as WinnerRow).recipientName : (row as NominationRow).nomineeName;
                    return (
                      <tr key={row.id} className="border-b border-white/8 align-top transition hover:bg-white/[0.035]">
                        <td className="max-w-[300px] px-4 py-4">
                          <p className="m-0 font-extrabold leading-snug text-gbe-text">{row.awardTitle}</p>
                          <p className="m-0 mt-1 text-sm font-medium text-gbe-muted">{row.market}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="m-0 font-bold text-gbe-text">{person}</p>
                          <p className="m-0 mt-1 text-sm font-medium text-gbe-muted">{row.organization || "No organization"}</p>
                        </td>
                        <td className="max-w-[210px] px-4 py-4 text-sm font-semibold text-gbe-text/78">{row.category}</td>
                        <td className="px-4 py-4 font-bold">{row.year}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${statusClasses(row.status)}`}>{row.status}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-gbe-muted transition hover:border-gbe-gold/50 hover:text-gbe-gold-bright" onClick={() => openEdit(row)} type="button" aria-label="Edit">
                              <Edit3 size={17} />
                            </button>
                            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-gbe-muted transition hover:border-red-400/50 hover:text-red-100" onClick={() => void removeRow(row)} type="button" aria-label="Delete">
                              <Trash2 size={17} />
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-gbe-muted">
            <span>
              Showing page {activeList.page} of {activeList.pages} · {activeList.total} records
            </span>
            <div className="flex gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 transition enabled:hover:border-gbe-gold/50 enabled:hover:text-gbe-text disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">
                <ChevronLeft size={16} />
                Prev
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 transition enabled:hover:border-gbe-gold/50 enabled:hover:text-gbe-text disabled:opacity-40" disabled={page >= activeList.pages || loading} onClick={() => setPage((value) => value + 1)} type="button">
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </section>

      {editing ? (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-md">
          <form className="mx-auto grid w-full max-w-[920px] gap-5 rounded-2xl border border-gbe-gold/20 bg-[#050505] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.7)]" onSubmit={saveForm}>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="m-0 text-xs font-black uppercase tracking-[0.18em] text-gbe-gold-bright">{editing.id ? "Edit record" : "New record"}</p>
                <h2 className="m-0 mt-1 text-2xl font-black">{tab === "winners" ? "Past winner" : "Nomination"}</h2>
              </div>
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-gbe-muted transition hover:border-gbe-gold/50 hover:text-gbe-text" onClick={() => setEditing(null)} type="button" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
              <TextField label="Award title" value={editing.awardTitle} onChange={(value) => setEditing({ ...editing, awardTitle: value })} required />
              <TextField label={tab === "winners" ? "Winner name" : "Nominee name"} value={editing.personName} onChange={(value) => setEditing({ ...editing, personName: value })} required />
              <TextField label="Organization" value={editing.organization} onChange={(value) => setEditing({ ...editing, organization: value })} />
              <TextField label="Category" value={editing.category} onChange={(value) => setEditing({ ...editing, category: value })} required />
              <TextField label="Year" value={editing.year} onChange={(value) => setEditing({ ...editing, year: value })} type="number" required />
              <TextField label="Market" value={editing.market} onChange={(value) => setEditing({ ...editing, market: value })} required />
              <SelectField label="Status" value={editing.status} onChange={(value) => setEditing({ ...editing, status: value })} options={tab === "winners" ? ["draft", "published", "archived"] : ["draft", "submitted", "shortlisted", "published", "archived"]} />
              <TextField label="Sort order" value={editing.sortOrder} onChange={(value) => setEditing({ ...editing, sortOrder: value })} type="number" />
              <TextField label="Slug" value={editing.slug} onChange={(value) => setEditing({ ...editing, slug: value })} />
            </div>

            <div className="grid gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="m-0 text-sm font-black uppercase tracking-[0.16em] text-gbe-gold-bright">Profile image</p>
                  <p className="m-0 mt-1 text-sm font-medium text-gbe-muted">Upload, replace, or remove the image used on public cards.</p>
                </div>
                {editing.imageUrl ? (
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-400/25 px-4 text-sm font-bold text-red-100 transition hover:border-red-400/60 hover:bg-red-400/10"
                    onClick={() => setEditing({ ...editing, imageUrl: "" })}
                    type="button"
                  >
                    Remove image
                  </button>
                ) : null}
              </div>
              <div className="grid grid-cols-[132px_minmax(0,1fr)] gap-4 max-[560px]:grid-cols-1">
                <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.035]">
                  {editing.imageUrl ? (
                    <img className="h-full w-full object-cover" src={editing.imageUrl} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <div className="grid place-items-center gap-2 text-center text-gbe-muted">
                      <UploadCloud size={28} />
                      <span className="text-xs font-bold uppercase tracking-[0.14em]">No image</span>
                    </div>
                  )}
                </div>
                <label className="flex min-w-0 cursor-pointer flex-col justify-center gap-3 rounded-xl border border-dashed border-gbe-gold/25 bg-black/25 px-5 py-4 text-sm font-bold text-gbe-muted transition hover:border-gbe-gold/60 hover:text-gbe-text">
                  <span className="inline-flex items-center gap-2 text-base text-gbe-text">
                    {uploading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
                    {uploading ? "Uploading image..." : editing.imageUrl ? "Replace image" : "Upload image"}
                  </span>
                  <span className="text-sm font-medium leading-6 text-gbe-muted">Images are stored in Cloudflare R2 and delivered from media.gbeaward.com. Accepted formats: JPG, PNG, WebP, AVIF up to 5MB.</span>
                  {editing.imageUrl ? <span className="truncate text-xs font-semibold text-gbe-gold-soft">{editing.imageUrl}</span> : null}
                  <input
                    className="sr-only"
                    disabled={uploading}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={(event) => {
                      void uploadImage(event.target.files?.[0] ?? null);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            <TextArea label="Summary" value={editing.summary} onChange={(value) => setEditing({ ...editing, summary: value })} rows={4} />
            {tab === "nominations" ? <TextArea label="Internal notes" value={editing.notes} onChange={(value) => setEditing({ ...editing, notes: value })} rows={3} /> : null}

            <div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
              <TextField label="SEO title" value={editing.seoTitle} onChange={(value) => setEditing({ ...editing, seoTitle: value })} />
              <TextField label="SEO description" value={editing.seoDescription} onChange={(value) => setEditing({ ...editing, seoDescription: value })} />
            </div>

            {message ? <p className="m-0 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100">{message}</p> : null}

            <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
              <button className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 text-sm font-bold text-gbe-muted transition hover:border-gbe-gold/40 hover:text-gbe-text" onClick={() => setEditing(null)} type="button">
                Cancel
              </button>
              <button className="btn-gold btn-gold-hover min-h-11 px-5 text-sm" disabled={saving} type="submit">
                {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                Save record
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
