import type { WinnerRichText, WinnerRichTextNode, WinnerStoryRecord } from "./types";

type EditorialSource = {
  note: string;
  host: string | null;
  isOfficialWebsite: boolean;
};

export type WinnerEditorialUpdate = Pick<
  WinnerStoryRecord,
  | "headline"
  | "standfirst"
  | "summary"
  | "awardCitation"
  | "achievementHighlights"
  | "body"
  | "seoTitle"
  | "seoDescription"
  | "authorName"
>;

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function words(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function text(value: string): WinnerRichTextNode {
  return { type: "text", text: value };
}

function paragraph(value: string): WinnerRichTextNode {
  return { type: "paragraph", content: [text(compact(value))] };
}

function heading(value: string): WinnerRichTextNode {
  return { type: "heading", attrs: { level: 2 }, content: [text(value)] };
}

function sourceDetails(winner: WinnerStoryRecord): EditorialSource[] {
  const officialUrl = winner.officialWebsiteUrl?.trim() || null;
  const entries = winner.sourceNotes || [];
  const references = [...(officialUrl ? [officialUrl] : []), ...entries];
  const seen = new Set<string>();

  return references.flatMap((note) => {
    const clean = note.trim();
    if (!clean || seen.has(clean)) return [];
    seen.add(clean);

    try {
      const url = new URL(clean);
      return [{ note: clean, host: url.hostname.replace(/^www\./, ""), isOfficialWebsite: clean === officialUrl }];
    } catch {
      return [{ note: clean, host: null, isOfficialWebsite: false }];
    }
  });
}

function readableHosts(sources: EditorialSource[]) {
  const hosts = [...new Set(sources.map((source) => source.host).filter((host): host is string => Boolean(host)))];
  if (hosts.length === 0) return "the source notes held with this winner record";
  if (hosts.length === 1) return hosts[0];
  if (hosts.length === 2) return `${hosts[0]} and ${hosts[1]}`;
  return `${hosts.slice(0, 2).join(", ")}, and other linked references`;
}

function fieldPerspective(industry: string | null | undefined, recipient: string, award: string, year: number) {
  const field = industry?.trim() || "this field";
  const lower = field.toLowerCase();

  if (/(solar|renewable|\bev\b|energy)/.test(lower)) {
    return `For ${recipient}'s ${award} record, the practical context is ${field}. Readers are usually trying to separate broad sustainability language from the work named in a service category, so this GBE title should not be turned into a claim about every energy or transport service available in the market.`;
  }

  if (/(education|college|academy|school)/.test(lower)) {
    return `For ${recipient}'s ${award} record, the relevant context is ${field}. Prospective learners and families need clear information about the kind of provider or programme they are considering, so this page keeps the award result separate from course selection, admission, accreditation, fees, or outcomes, which should always be checked directly with the provider.`;
  }

  if (/(health|wellness|ayurveda|homeopathic)/.test(lower)) {
    return `For ${recipient}'s ${award} record, the relevant context is ${field}. An award profile should be careful not to become medical advice or a promise of outcomes, so this page records the recognition only; anyone considering a service should review the provider's current information and seek appropriate professional guidance for their own circumstances.`;
  }

  if (/(finance|investment|bank|microfinance)/.test(lower)) {
    return `For ${recipient}'s ${award} record, the relevant context is ${field}. Public recognition and financial suitability are different questions: this award confirms a ${year} GBE result, not investment, lending, or financial advice. Visitors should use official channels for current terms, eligibility, and regulatory information.`;
  }

  if (/(television|acting|broadcast|photography|design|floristry|jewellery)/.test(lower)) {
    return `For ${recipient}'s ${award} record, the relevant context is ${field}. People often discover work through programmes, portfolios, campaigns, or public channels; this profile records the particular GBE recognition and directs readers to linked sources for ${recipient}'s current public presence.`;
  }

  if (/(hospitality|bakery|beauty|pet|pest|retail|food|coffee|tea)/.test(lower)) {
    return `For ${recipient}'s ${award} record, the relevant context is ${field}. A precise award record is more useful than broad promotional language: current availability, locations, prices, menus, bookings, and services should be confirmed directly with ${recipient}.`;
  }

  return `For ${recipient}'s ${award} record, the relevant context is ${field}. Readers benefit from seeing exactly what was recognised and where the supporting record can be checked, rather than a page that rates the whole market or repeats unverified promotional claims.`;
}

function recipientPerspective(winner: WinnerStoryRecord, recipient: string, award: string) {
  const type = winner.recipientType || "organization";
  if (type === "person") {
    return `${recipient} is recorded here in an individual capacity for the ${award}. The award title is attached to the named person in this GBE Awards result, while any current role, employer, representation, or work should be verified through the public sources linked below.`;
  }
  if (type === "creative_work") {
    return `${recipient} is recorded here as a creative work or programme for the ${award}. The award is attached to that named work in the 2025 results, while production, distribution, cast, credits, and current availability remain matters for the linked public sources.`;
  }
  return `${recipient} is recorded here as an organisation or business for the ${award}. The award belongs to the named recipient and the stated category; current operations, products, services, and contact details are best confirmed through its official channels.`;
}

function trimDescription(value: string, maximum = 160) {
  const clean = compact(value);
  if (clean.length <= maximum) return clean;
  const cut = clean.slice(0, maximum - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 80)).trim()}…`;
}

/**
 * Builds a factual, reader-first winner profile from fields already reviewed in
 * the CMS. It intentionally does not infer achievements, statistics, quotes,
 * or credentials that are absent from the award record and source trail.
 */
export function buildWinnerEditorialUpdate(winner: WinnerStoryRecord): WinnerEditorialUpdate {
  const recipient = winner.recipientName?.trim() || "The recipient";
  const award = winner.awardTitle?.trim() || "Global Business Excellence Award";
  const year = winner.year || 2025;
  const industry = winner.industry?.trim() || "the relevant field";
  const sources = sourceDetails(winner);
  const official = sources.find((source) => source.isOfficialWebsite);
  const sourceSummary = readableHosts(sources);
  const sourceParagraph = official?.host
    ? `${recipient}'s official website is listed as ${official.host}. The wider reference trail for this ${award} profile includes ${sourceSummary}. Those links give readers a route to the original award archive and to public information connected with the recipient; they are included for verification, not as a substitute for the award record.`
    : `The reference trail for ${recipient}'s ${award} profile includes ${sourceSummary}. Those links give readers a route to the GBE Awards archive and to public information connected with ${recipient}. They are included for verification, not as a substitute for the award record.`;
  const body: WinnerRichText = {
    type: "doc",
    content: [
      heading(`The ${year} recognition`),
      paragraph(`${recipient} received the ${award} at the Global Business Excellence Awards ${year}. This page is the public record of that result: it names the recipient, preserves the exact award title, and makes the recognition straightforward to find when someone is searching for ${recipient} or the ${award} award.`),
      paragraph(`GBE Awards granted this recognition as part of its ${year} previous-winners programme. The wording matters. “${award}” is the specific accolade recorded for ${recipient}; it should not be broadened into a claim about every activity, product, service, project, or person associated with the recipient.`),
      heading(`What the award title covers`),
      paragraph(`The ${award} category sits within ${industry}. Its purpose in this winner record is narrow and clear: it identifies the area in which GBE Awards recognised ${recipient}. That level of specificity helps visitors distinguish this result from similarly named businesses, general directory listings, and marketing statements that may appear elsewhere online.`),
      paragraph(fieldPerspective(winner.industry, recipient, award, year)),
      heading(`About this winner record`),
      paragraph(recipientPerspective(winner, recipient, award)),
      paragraph(`For readers researching ${recipient}, the useful takeaway is factual rather than inflated: GBE Awards named ${recipient} the ${award} for ${year}. The title is an award result, not an automatic recommendation for a particular purchase, booking, treatment, financial decision, or professional engagement. Current details should always be checked directly with the recipient.`),
      heading(`How to read the result`),
      paragraph(`A good award record should answer a simple question without creating a second story around it. In this case, the answer is that ${recipient} was the ${year} GBE Awards recipient for ${award}. The recipient's name, the full category title, and the award year are the durable details to use when referring to the result in a profile, press reference, search query, or citation.`),
      paragraph(`The ${award} title should also be read in its original context. It records one GBE Awards decision for one award cycle. It does not claim that ${recipient} has won every comparable title, holds a permanent market position, or has been independently assessed by every source linked from this page. Keeping that boundary clear makes the record more useful to readers and fairer to the recipient.`),
      heading(`Sources and editorial review`),
      paragraph(sourceParagraph),
      paragraph(`For ${recipient}'s ${award} entry, the GBE Awards Editorial Team reviewed the published record and the references linked with it before updating this page. The article does not add quotes, rankings, audience figures, credentials, or performance claims that cannot be supported by the available sources. If a material detail changes, the CMS record can be revised with a fresh source trail and a new fact-check date.`),
    ],
  };
  const summary = `${recipient} received the ${award} at the Global Business Excellence Awards ${year}.`;
  const headline = `${recipient} wins ${award} at the Global Business Excellence Awards ${year}`;
  const standfirst = `GBE Awards recognised ${recipient} with the ${award} in ${year}. This verified winner profile records the result, explains its scope, and links to the sources reviewed for the entry.`;

  return {
    headline,
    standfirst,
    summary,
    awardCitation: `GBE Awards ${year} recognition: ${recipient} — ${award}.`,
    achievementHighlights: [
      `GBE Awards ${year} recipient: ${recipient}.`,
      `Recognition recorded: ${award}.`,
      `Editorial record reviewed against the GBE Awards archive and linked public sources.`,
    ],
    body,
    seoTitle: `${recipient} wins ${award} | GBE Awards ${year}`,
    seoDescription: trimDescription(`Official GBE Awards ${year} winner record: ${recipient} received the ${award}. View the award details and the sources reviewed for this entry.`),
    authorName: "GBE Awards Editorial Team",
  };
}

export function winnerEditorialWordCount(update: WinnerEditorialUpdate) {
  if (!update.body || typeof update.body === "string") return 0;
  const collect = (node: WinnerRichTextNode): string[] => [node.text || "", ...(node.content || []).flatMap(collect)];
  return words(collect(update.body).join(" "));
}
