import { useState } from "react";
import {
  ImagePlus,
  Loader2,
  Save,
  Search as SearchIcon,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  Button,
  Modal,
  SelectField,
  TextArea,
  TextField,
  cn,
  type ContentKind,
  type FormState,
  type RowRecord,
} from "./ui";

const MARKETS = ["International", "United Kingdom", "Sri Lanka", "Europe", "Asia", "North America", "Middle East", "Africa"];
type ImageField = "imageUrl" | "heroImageUrl";

function sectionTitle(title: string, desc: string) {
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      <p className="mt-0.5 text-xs text-zinc-600">{desc}</p>
    </div>
  );
}

export default function AdminForm({
  kind,
  editing,
  onClose,
  onSaved,
  showToast,
}: {
  kind: ContentKind;
  editing: FormState;
  onClose: () => void;
  onSaved: () => void;
  showToast: (t: { title: string; description?: string; variant?: "success" | "error" | "info" }) => void;
}) {
  const [form, setForm] = useState<FormState>(editing);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<ImageField | null>(null);
  const [formError, setFormError] = useState("");

  const isWinner = kind === "winners";
  const uploadingProfile = uploadingField === "imageUrl";
  const uploadingBanner = uploadingField === "heroImageUrl";

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadImage(file: File | null, field: ImageField) {
    if (!file) return;
    setUploadingField(field);
    setFormError("");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", field === "heroImageUrl" ? `${kind}-banners` : `${kind}-profiles`);

    try {
      const res = await fetch("/api/gbe-admin-safe/upload", {
        method: "POST",
        body: fd,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? "Image upload failed.");
      }
      set(field, body.url as string);
      showToast({
        title: field === "heroImageUrl" ? "Banner image uploaded" : "Profile image uploaded",
        variant: "success",
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.awardTitle.trim() || !form.personName.trim()) {
      setFormError("Award title and name are required.");
      return;
    }
    setSaving(true);
    setFormError("");

    const payload = isWinner
      ? {
          awardTitle: form.awardTitle,
          recipientName: form.personName,
          organization: form.organization,
          category: form.category,
          year: form.year,
          summary: form.summary,
          imageUrl: form.imageUrl,
          slug: form.slug,
          status: form.status,
          sortOrder: form.sortOrder,
          heroImageUrl: form.heroImageUrl,
          heroImageAlt: form.heroImageAlt,
          heroImageCaption: form.heroImageCaption,
          heroImageCredit: form.heroImageCredit,
          seoTitle: form.seoTitle,
          seoDescription: form.seoDescription,
        }
      : {
          awardTitle: form.awardTitle,
          nomineeName: form.personName,
          organization: form.organization,
          category: form.category,
          year: form.year,
          market: form.market,
          summary: form.summary,
          notes: form.notes,
          imageUrl: form.imageUrl,
          slug: form.slug,
          status: form.status,
          sortOrder: form.sortOrder,
          seoTitle: form.seoTitle,
          seoDescription: form.seoDescription,
        };

    const endpoint = form.id
      ? `/api/gbe-admin-safe/${kind}/${form.id}`
      : `/api/gbe-admin-safe/${kind}`;
    const method = form.id ? "PUT" : "POST";

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        window.location.reload();
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Could not save. Check the fields.");
      }

      showToast({
        title: form.id ? "Record updated" : "Record created",
        description: `${form.personName || "Untitled"} saved successfully.`,
        variant: "success",
      });
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save record.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} labelledBy="form-title">
      <form
        className="flex max-h-[calc(100vh-4rem)] flex-col"
        onSubmit={handleSubmit}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#ffd05a]">
              {form.id ? "Edit" : "New"} {isWinner ? "winner" : "nomination"}
            </p>
            <h2 id="form-title" className="mt-1 text-lg font-bold text-zinc-50">
              {form.awardTitle || (isWinner ? "Past winner" : "Nomination")}
            </h2>
          </div>
          <button
            className="grid size-8 shrink-0 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          {/* Details */}
          <section className="space-y-4">
            {sectionTitle("Details", "Core information shown on public cards.")}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Award title"
                value={form.awardTitle}
                onChange={(v) => set("awardTitle", v)}
                required
                placeholder="e.g. Entrepreneur of the Year"
              />
              <TextField
                label={isWinner ? "Winner name" : "Nominee name"}
                value={form.personName}
                onChange={(v) => set("personName", v)}
                required
                placeholder="Full name"
              />
              <TextField
                label="Organization"
                value={form.organization}
                onChange={(v) => set("organization", v)}
                placeholder="Optional"
              />
              <TextField
                label="Category"
                value={form.category}
                onChange={(v) => set("category", v)}
                required
                placeholder="e.g. Technology"
              />
              <TextField
                label="Year"
                value={form.year}
                onChange={(v) => set("year", v)}
                type="number"
                required
              />
              {!isWinner ? (
                <SelectField
                  label="Market"
                  value={form.market}
                  onChange={(v) => set("market", v)}
                  options={MARKETS.map((m) => ({ value: m, label: m }))}
                />
              ) : null}
            </div>
          </section>

          {/* Status & ordering */}
          <section className="space-y-4 border-t border-white/[0.05] pt-6">
            {sectionTitle(
              "Status & ordering",
              "Control visibility and display order on the site.",
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <SelectField
                label="Status"
                value={form.status}
                onChange={(v) => set("status", v)}
                options={
                  isWinner
                    ? [
                        { value: "draft", label: "Draft" },
                        { value: "published", label: "Published" },
                        { value: "archived", label: "Archived" },
                      ]
                    : [
                        { value: "draft", label: "Draft" },
                        { value: "submitted", label: "Submitted" },
                        { value: "shortlisted", label: "Shortlisted" },
                        { value: "published", label: "Published" },
                        { value: "archived", label: "Archived" },
                      ]
                }
              />
              <TextField
                label="Sort order"
                value={form.sortOrder}
                onChange={(v) => set("sortOrder", v)}
                type="number"
                hint="Lower shows first"
              />
              <TextField
                label="Slug"
                value={form.slug}
                onChange={(v) => set("slug", v)}
                placeholder="Auto-generated"
              />
            </div>
          </section>

          {/* Profile image */}
          <section className="space-y-4 border-t border-white/[0.05] pt-6">
            {sectionTitle(
              "Profile image",
              isWinner
                ? "Used for cards, profile logo, and as the story image when no banner is uploaded."
                : "Stored in Cloudflare R2, delivered from the media CDN.",
            )}
            <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
              <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0e11]">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-zinc-600">
                    <ImagePlus size={22} />
                    <span className="text-[10px] font-semibold uppercase tracking-wide">
                      No image
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  className={cn(
                    "flex cursor-pointer flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.12] bg-[#0c0c0f] px-4 py-3 text-center transition",
                    "hover:border-[#ffb001]/40 hover:bg-[#ffb001]/[0.03]",
                    uploadingField ? "pointer-events-none opacity-70" : "",
                  )}
                >
                  {uploadingProfile ? (
                    <Loader2 size={20} className="animate-spin text-[#ffb001]" />
                  ) : (
                    <UploadCloud size={20} className="text-zinc-400" />
                  )}
                  <span className="text-sm font-medium text-zinc-300">
                    {uploadingProfile
                      ? "Uploading..."
                      : form.imageUrl
                        ? "Replace image"
                        : "Upload image"}
                  </span>
                  <span className="text-[11px] text-zinc-600">
                    JPG, PNG, WebP or AVIF &middot; max 5MB
                  </span>
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={Boolean(uploadingField)}
                    onChange={(e) => {
                      void uploadImage(e.target.files?.[0] ?? null, "imageUrl");
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {form.imageUrl ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-[#0e0e11] px-3 py-2">
                    <span className="truncate text-[11px] text-zinc-500">
                      {form.imageUrl}
                    </span>
                    <button
                      className="grid size-7 shrink-0 place-items-center rounded-md text-rose-400/70 transition hover:bg-rose-500/10 hover:text-rose-300"
                      onClick={() => set("imageUrl", "")}
                      disabled={Boolean(uploadingField)}
                      type="button"
                      aria-label="Remove image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {isWinner ? (
            <section className="space-y-4 border-t border-white/[0.05] pt-6">
              {sectionTitle(
                "Story banner image",
                "Optional wide image for the winner story hero. Leave empty to keep the current profile-image layout.",
              )}
              <div className="grid gap-4">
                <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0e11]">
                  <div className="grid aspect-[16/7] min-h-[180px] place-items-center">
                    {form.heroImageUrl ? (
                      <img
                        src={form.heroImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-zinc-600">
                        <ImagePlus size={24} />
                        <span className="text-[11px] font-semibold uppercase tracking-wide">
                          No banner image
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.12] bg-[#0c0c0f] px-4 py-4 text-center transition",
                      "hover:border-[#ffb001]/40 hover:bg-[#ffb001]/[0.03]",
                      uploadingField ? "pointer-events-none opacity-70" : "",
                    )}
                  >
                    {uploadingBanner ? (
                      <Loader2 size={20} className="animate-spin text-[#ffb001]" />
                    ) : (
                      <UploadCloud size={20} className="text-zinc-400" />
                    )}
                    <span className="text-sm font-medium text-zinc-300">
                      {uploadingBanner
                        ? "Uploading..."
                        : form.heroImageUrl
                          ? "Replace banner"
                          : "Upload banner"}
                    </span>
                    <span className="text-[11px] text-zinc-600">
                      Wide JPG, PNG, WebP or AVIF &middot; max 5MB
                    </span>
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={Boolean(uploadingField)}
                      onChange={(e) => {
                        void uploadImage(e.target.files?.[0] ?? null, "heroImageUrl");
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {form.heroImageUrl ? (
                    <button
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-rose-500/25 px-4 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
                      onClick={() => {
                        set("heroImageUrl", "");
                        set("heroImageAlt", "");
                        set("heroImageCaption", "");
                        set("heroImageCredit", "");
                      }}
                      disabled={Boolean(uploadingField)}
                      type="button"
                    >
                      <Trash2 size={15} />
                      Remove
                    </button>
                  ) : null}
                </div>

                {form.heroImageUrl ? (
                  <div className="rounded-lg bg-[#0e0e11] px-3 py-2">
                    <p className="truncate text-[11px] text-zinc-500">{form.heroImageUrl}</p>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Banner alt text"
                    value={form.heroImageAlt}
                    onChange={(v) => set("heroImageAlt", v)}
                    placeholder="Describe the banner image"
                  />
                  <TextField
                    label="Image credit"
                    value={form.heroImageCredit}
                    onChange={(v) => set("heroImageCredit", v)}
                    placeholder="Optional"
                  />
                  <div className="sm:col-span-2">
                    <TextField
                      label="Caption"
                      value={form.heroImageCaption}
                      onChange={(v) => set("heroImageCaption", v)}
                      placeholder="Optional public caption"
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* Summary */}
          <section className="space-y-4 border-t border-white/[0.05] pt-6">
            {sectionTitle("Content", "Descriptions and notes.")}
            <TextArea
              label="Summary"
              value={form.summary}
              onChange={(v) => set("summary", v)}
              rows={4}
              placeholder="Short public-facing summary..."
            />
            {!isWinner ? (
              <TextArea
                label="Internal notes"
                value={form.notes}
                onChange={(v) => set("notes", v)}
                rows={3}
                placeholder="Private notes (not shown publicly)..."
              />
            ) : null}
          </section>

          {/* SEO */}
          <section className="space-y-4 border-t border-white/[0.05] pt-6">
            {sectionTitle("SEO", "Optional overrides for search and social.")}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="SEO title"
                value={form.seoTitle}
                onChange={(v) => set("seoTitle", v)}
                placeholder="Optional"
              />
              <TextField
                label="SEO description"
                value={form.seoDescription}
                onChange={(v) => set("seoDescription", v)}
                placeholder="Optional"
              />
            </div>
          </section>

          {formError ? (
            <div className="flex items-center gap-2 rounded-lg border border-rose-400/25 bg-rose-400/[0.07] px-3.5 py-2.5 text-[13px] font-medium text-rose-300">
              <X size={15} />
              {formError}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-[#0c0c0f] px-6 py-4">
          <p className="hidden items-center gap-1.5 text-xs text-zinc-600 sm:flex">
            <SearchIcon size={13} />
            Changes go live on the public site instantly
          </p>
          <div className="flex w-full gap-2.5 sm:w-auto">
            <Button variant="ghost" size="md" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={saving}
              icon={!saving ? Save : undefined}
              className="flex-1 sm:flex-none"
            >
              {saving ? "Saving..." : form.id ? "Save changes" : "Create record"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export function blankForm(kind: ContentKind): FormState {
  return {
    awardTitle: "",
    personName: "",
    organization: "",
    category: "",
    year: "2026",
    market: "International",
    summary: "",
    notes: "",
    imageUrl: "",
    heroImageUrl: "",
    heroImageAlt: "",
    heroImageCaption: "",
    heroImageCredit: "",
    slug: "",
    status: kind === "winners" ? "draft" : "submitted",
    sortOrder: "0",
    seoTitle: "",
    seoDescription: "",
  };
}

export function rowToForm(kind: ContentKind, row: RowRecord): FormState {
  const personName =
    kind === "winners"
      ? (row as RowRecord & { recipientName: string }).recipientName
      : (row as RowRecord & { nomineeName: string }).nomineeName;
  const winnerRow = kind === "winners" ? (row as RowRecord & {
    heroImageUrl?: string | null;
    heroImageAlt?: string | null;
    heroImageCaption?: string | null;
    heroImageCredit?: string | null;
  }) : null;

  return {
    id: row.id,
    awardTitle: row.awardTitle,
    personName,
    organization: row.organization ?? "",
    category: row.category,
    year: String(row.year),
    market: kind === "nominations" ? row.market : "",
    summary: row.summary,
    notes: kind === "nominations" ? (row as RowRecord & { notes: string }).notes : "",
    imageUrl: row.imageUrl ?? "",
    heroImageUrl: winnerRow?.heroImageUrl ?? "",
    heroImageAlt: winnerRow?.heroImageAlt ?? "",
    heroImageCaption: winnerRow?.heroImageCaption ?? "",
    heroImageCredit: winnerRow?.heroImageCredit ?? "",
    slug: row.slug,
    status: row.status,
    sortOrder: String(row.sortOrder),
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
  };
}
