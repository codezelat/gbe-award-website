import { useMemo, useState } from "react";
import {
  ImagePlus,
  ChevronDown,
  Loader2,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  Button,
  ConfirmDialog,
  Modal,
  SelectField,
  TextArea,
  TextField,
  cn,
  type ContentKind,
  type FormState,
  type RowRecord,
} from "./ui";
import WinnerRichTextEditor from "./WinnerRichTextEditor";

const MARKETS = ["International", "United Kingdom", "Sri Lanka", "Europe", "Asia", "North America", "Middle East", "Africa"];
type ImageField = "imageUrl" | "heroImageUrl";

function sectionTitle(title: string, desc: string) {
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-wide text-zinc-500">{title}</p>
      <p className="mt-0.5 text-xs text-zinc-600">{desc}</p>
    </div>
  );
}

function CollapsibleFormSection({
  title,
  description,
  open = false,
  children,
}: {
  title: string;
  description?: string;
  open?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 transition open:border-white/[0.1] open:bg-white/[0.025]"
      defaultOpen={open}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
          {description ? <p className="mt-0.5 text-[13px] text-zinc-500">{description}</p> : null}
        </div>
        <ChevronDown className="size-4 shrink-0 text-zinc-500 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-white/[0.06] py-4">{children}</div>
    </details>
  );
}

function toLineItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function dateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
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
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const isWinner = kind === "winners";
  const uploadingProfile = uploadingField === "imageUrl";
  const uploadingBanner = uploadingField === "heroImageUrl";
  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(editing),
    [editing, form],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function requestClose() {
    if (saving || uploadingField) return;
    if (isDirty) {
      setDiscardDialogOpen(true);
      return;
    }
    onClose();
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
          socialImageUrl: form.socialImageUrl,
          recipientType: form.recipientType,
          articleType: form.articleType,
          headline: form.headline,
          standfirst: form.standfirst,
          body: form.body,
          industry: form.industry,
          officialWebsiteUrl: form.officialWebsiteUrl,
          linkedinUrl: form.linkedinUrl,
          facebookUrl: form.facebookUrl,
          instagramUrl: form.instagramUrl,
          ceremonyDate: form.ceremonyDate,
          awardCitation: form.awardCitation,
          achievementHighlights: toLineItems(form.achievementHighlights),
          quoteText: form.quoteText,
          quoteAuthor: form.quoteAuthor,
          quoteAuthorRole: form.quoteAuthorRole,
          authorName: form.authorName,
          publishedAt: form.publishedAt,
          factCheckedAt: form.factCheckedAt,
          indexingStatus: form.indexingStatus,
          sourceNotes: toLineItems(form.sourceNotes),
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
    <>
    <Modal open onClose={discardDialogOpen ? () => {} : requestClose} labelledBy="form-title">
      <form className="flex max-h-[calc(100dvh-2rem)] min-h-[min(720px,calc(100dvh-2rem))] flex-col sm:max-h-[calc(100dvh-4rem)]" onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffd05a]">
              {form.id ? "Editing" : "New"} {isWinner ? "winner" : "nomination"}
            </p>
            <h2 id="form-title" className="mt-1 truncate text-lg font-bold tracking-tight text-zinc-50 sm:text-xl">
              {form.personName || form.awardTitle || (isWinner ? "Past winner" : "Nomination")}
            </h2>
          </div>
          <button
            className="grid size-9 shrink-0 place-items-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb001]/40"
            onClick={requestClose}
            type="button"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="mx-auto max-w-4xl space-y-6">
          {/* Details */}
          <section className="space-y-4">
            {sectionTitle("Essentials", "The details people see first.")}
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Award title"
                value={form.awardTitle}
                onChange={(v) => set("awardTitle", v)}
                required
                placeholder="e.g. Entrepreneur of the Year"
                autoFocus
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

          <section className="space-y-4 border-t border-white/[0.05] pt-6">
            {sectionTitle("Summary", "A short public-facing description.")}
            <TextArea
              label="Summary"
              value={form.summary}
              onChange={(v) => set("summary", v)}
              rows={4}
              placeholder="What should people know about this recognition?"
            />
            {!isWinner ? (
              <TextArea
                label="Internal notes"
                value={form.notes}
                onChange={(v) => set("notes", v)}
                rows={3}
                placeholder="Private notes, not shown publicly"
              />
            ) : null}
          </section>

          {/* Status & ordering */}
          <CollapsibleFormSection
            title="Publishing"
            description={`Currently ${form.status}. Visibility, order and URL settings.`}
          >
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
              {isWinner ? (
                <SelectField
                  label="Search indexing"
                  value={form.indexingStatus}
                  onChange={(v) => set("indexingStatus", v as "index" | "noindex")}
                  options={[
                    { value: "noindex", label: "Noindex — review" },
                    { value: "index", label: "Index — approved" },
                  ]}
                />
              ) : null}
            </div>
            {isWinner ? (
              <p className="text-xs leading-relaxed text-zinc-600">
                Only index a published, source-backed story with complete editorial fields.
              </p>
            ) : null}
          </CollapsibleFormSection>

          {/* Profile image */}
          <CollapsibleFormSection
            title="Profile image"
            description={form.imageUrl ? "Image ready" : "Add an image for public cards"}
            open={!form.imageUrl}
          >
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
          </CollapsibleFormSection>

          {isWinner ? (
            <CollapsibleFormSection
              title="Story banner"
              description={form.heroImageUrl ? "Banner ready" : "Optional wide image for the story page"}
              open={Boolean(form.heroImageUrl)}
            >
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
            </CollapsibleFormSection>
          ) : null}

          {isWinner ? (
            <CollapsibleFormSection
              title="Winner story"
              description={form.body ? "Story content added" : "Add the public article when it is ready"}
              open={Boolean(form.body || form.headline || form.standfirst)}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Public headline" value={form.headline} onChange={(v) => set("headline", v)} placeholder="Describe this specific award win" />
                <SelectField
                  label="Recipient type"
                  value={form.recipientType}
                  onChange={(v) => set("recipientType", v as "person" | "organization" | "creative_work")}
                  options={[
                    { value: "organization", label: "Organization" },
                    { value: "person", label: "Person" },
                    { value: "creative_work", label: "Creative work" },
                  ]}
                />
                <div className="sm:col-span-2">
                  <TextArea label="Standfirst" value={form.standfirst} onChange={(v) => set("standfirst", v)} rows={3} placeholder="A factual 1–2 sentence summary of the recognition and why it matters." />
                </div>
                <TextField label="Industry" value={form.industry} onChange={(v) => set("industry", v)} placeholder="e.g. Acting and television" />
                <SelectField
                  label="Structured-data type"
                  value={form.articleType}
                  onChange={(v) => set("articleType", v as "article" | "news")}
                  options={[
                    { value: "article", label: "Article" },
                    { value: "news", label: "News article" },
                  ]}
                />
              </div>
              <div>
                <p className="mb-1.5 text-[13px] font-medium text-zinc-300">Article body</p>
                <WinnerRichTextEditor value={form.body} onChange={(value) => set("body", value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextArea label="Award citation" value={form.awardCitation} onChange={(v) => set("awardCitation", v)} rows={3} placeholder="Optional factual award citation." />
                <TextArea label="Achievement highlights" value={form.achievementHighlights} onChange={(v) => set("achievementHighlights", v)} rows={3} placeholder="One factual, source-supported highlight per line." />
                <TextArea label="Quote" value={form.quoteText} onChange={(v) => set("quoteText", v)} rows={3} placeholder="Optional verified quote only." />
                <div className="grid gap-4">
                  <TextField label="Quote author" value={form.quoteAuthor} onChange={(v) => set("quoteAuthor", v)} placeholder="Required when using a quote" />
                  <TextField label="Quote author role" value={form.quoteAuthorRole} onChange={(v) => set("quoteAuthorRole", v)} placeholder="Optional" />
                </div>
              </div>
            </CollapsibleFormSection>
          ) : null}

          {isWinner ? (
            <CollapsibleFormSection
              title="Verification & links"
              description="Sources, author, dates and public links."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Author / reviewer" value={form.authorName} onChange={(v) => set("authorName", v)} placeholder="e.g. London Business Consultancy editorial team" />
                <TextField label="Official website" value={form.officialWebsiteUrl} onChange={(v) => set("officialWebsiteUrl", v)} type="url" placeholder="https://..." />
                <TextField label="LinkedIn URL" value={form.linkedinUrl} onChange={(v) => set("linkedinUrl", v)} type="url" placeholder="https://..." />
                <TextField label="Facebook URL" value={form.facebookUrl} onChange={(v) => set("facebookUrl", v)} type="url" placeholder="https://..." />
                <TextField label="Instagram URL" value={form.instagramUrl} onChange={(v) => set("instagramUrl", v)} type="url" placeholder="https://..." />
                <TextField label="Social sharing image URL" value={form.socialImageUrl} onChange={(v) => set("socialImageUrl", v)} type="url" placeholder="Optional; use an approved R2 image URL" />
                <TextField label="Ceremony date" value={form.ceremonyDate} onChange={(v) => set("ceremonyDate", v)} type="date" />
                <TextField label="Published date" value={form.publishedAt} onChange={(v) => set("publishedAt", v)} type="date" hint="Set the original publication date; it is set automatically on first publish." />
                <TextField label="Fact-check date" value={form.factCheckedAt} onChange={(v) => set("factCheckedAt", v)} type="date" hint="Required before a story can be indexed." />
                <div className="sm:col-span-2">
                  <TextArea label="Source notes" value={form.sourceNotes} onChange={(v) => set("sourceNotes", v)} rows={5} placeholder="One supporting source URL or citation per line. These appear on the public story as its evidence trail." />
                </div>
              </div>
            </CollapsibleFormSection>
          ) : null}

          {/* SEO */}
          <CollapsibleFormSection
            title="Search preview"
            description="Optional title and description overrides."
          >
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
          </CollapsibleFormSection>

          {formError ? (
            <div className="flex items-center gap-2 rounded-lg border border-rose-400/25 bg-rose-400/[0.07] px-3.5 py-2.5 text-[13px] font-medium text-rose-300">
              <X size={15} />
              {formError}
            </div>
          ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-[#0c0c0f]/95 px-5 py-3.5 backdrop-blur sm:px-7 sm:py-4">
          <p className="hidden text-xs text-zinc-500 sm:block">
            {form.status === "published"
              ? "Published changes are visible on the public site."
              : "This record stays private until published."}
          </p>
          <div className="flex w-full gap-2.5 sm:w-auto">
            <Button variant="ghost" size="md" onClick={requestClose} type="button">
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
    <ConfirmDialog
      open={discardDialogOpen}
      title="Discard unsaved changes?"
      description="Your edits have not been saved."
      confirmLabel="Discard changes"
      cancelLabel="Keep editing"
      tone="danger"
      onClose={() => setDiscardDialogOpen(false)}
      onConfirm={onClose}
    />
    </>
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
    socialImageUrl: "",
    recipientType: "organization",
    articleType: "article",
    headline: "",
    standfirst: "",
    body: null,
    industry: "",
    officialWebsiteUrl: "",
    linkedinUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    ceremonyDate: "",
    awardCitation: "",
    achievementHighlights: "",
    quoteText: "",
    quoteAuthor: "",
    quoteAuthorRole: "",
    authorName: "",
    publishedAt: "",
    factCheckedAt: "",
    indexingStatus: "noindex",
    sourceNotes: "",
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
  const winnerRow = kind === "winners" ? (row as Extract<RowRecord, { recipientName: string }>) : null;

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
    socialImageUrl: winnerRow?.socialImageUrl ?? "",
    recipientType: winnerRow?.recipientType ?? "organization",
    articleType: winnerRow?.articleType ?? "article",
    headline: winnerRow?.headline ?? "",
    standfirst: winnerRow?.standfirst ?? "",
    body: winnerRow?.body ?? null,
    industry: winnerRow?.industry ?? "",
    officialWebsiteUrl: winnerRow?.officialWebsiteUrl ?? "",
    linkedinUrl: winnerRow?.linkedinUrl ?? "",
    facebookUrl: winnerRow?.facebookUrl ?? "",
    instagramUrl: winnerRow?.instagramUrl ?? "",
    ceremonyDate: dateInputValue(winnerRow?.ceremonyDate),
    awardCitation: winnerRow?.awardCitation ?? "",
    achievementHighlights: winnerRow?.achievementHighlights?.join("\n") ?? "",
    quoteText: winnerRow?.quoteText ?? "",
    quoteAuthor: winnerRow?.quoteAuthor ?? "",
    quoteAuthorRole: winnerRow?.quoteAuthorRole ?? "",
    authorName: winnerRow?.authorName ?? "",
    publishedAt: dateInputValue(winnerRow?.publishedAt),
    factCheckedAt: dateInputValue(winnerRow?.factCheckedAt),
    indexingStatus: winnerRow?.indexingStatus ?? "noindex",
    sourceNotes: winnerRow?.sourceNotes?.join("\n") ?? "",
    slug: row.slug,
    status: row.status,
    sortOrder: String(row.sortOrder),
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
  };
}
