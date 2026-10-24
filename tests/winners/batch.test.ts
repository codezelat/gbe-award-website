import { describe, expect, it } from "vitest";
import { assertCompleteRegister, parseAwardRegister, prepareWinner, validatePreparedWinners, type WinnerBatchDraft } from "../../scripts/lib/winner-batch";

const register = [{ index: 1, recipientName: "Exact Recipient (Pvt) Ltd", awardTitle: "Best Service & Support" }];
const draft: WinnerBatchDraft = { ...register[0], recipientType: "organization", industry: "Professional services", standfirst: "A carefully sourced introduction to the recipient and its award recognition at Global Business Excellence Awards 2026.", sections: [], sources: ["https://example.org/about"], imageUrl: "https://media.example.org/logo.webp", imageKind: "logo", indexingApproved: true, reviewNote: "Award confirmed by organiser; source reviewed." };

describe("organiser-approved winner batch", () => {
  it("parses tab-separated rows without changing approved spelling or punctuation", () => {
    expect(parseAwardRegister("INDEX\tName\tTitle\n1\tExact Recipient (Pvt) Ltd\tBest Service & Support\n\n")).toEqual(register);
  });
  it("rejects ambiguous extra columns", () => {
    expect(() => parseAwardRegister("1\tName\tAward\tOther")).toThrow("Invalid register");
  });
  it("requires every numbered entry and exact identity", () => {
    expect(() => assertCompleteRegister(register, [draft], 1)).not.toThrow();
    expect(() => assertCompleteRegister(register, [{ ...draft, recipientName: "Renamed" }], 1)).toThrow("differs");
    expect(() => assertCompleteRegister(register, [], 1)).toThrow("exactly");
    expect(() => assertCompleteRegister([...register, register[0]], [draft, draft], 2)).toThrow("Duplicate");
  });
  it("never allows search indexing without a reviewed source", () => {
    expect(() => assertCompleteRegister(register, [{ ...draft, sources: [] }], 1)).toThrow("reviewed public source");
    expect(() => assertCompleteRegister(register, [{ ...draft, sources: [], indexingApproved: false }], 1)).not.toThrow();
  });
  it("creates a separate 2026 published record and retains the exact award title", () => {
    const row = prepareWinner(draft, 2026, new Date("2026-10-25T00:00:00Z"));
    expect(row).toMatchObject({ id: "gbe-2026-001", year: 2026, awardTitle: draft.awardTitle, recipientName: draft.recipientName, category: draft.awardTitle, status: "published", indexingStatus: "index" });
    expect(row.slug).toContain("2026");
    expect(row).not.toHaveProperty("market");
    expect(row.heroImageAlt.length).toBeGreaterThan(20);
  });
  it("retains the noindex gate even when publishing a record", () => {
    expect(prepareWinner({ ...draft, indexingApproved: false }, 2026, new Date()).indexingStatus).toBe("noindex");
  });
  it("gives multiple awards for the same recipient separate identities and URLs", () => {
    const a = prepareWinner(draft, 2026, new Date());
    const b = prepareWinner({ ...draft, index: 2, awardTitle: "Best Other Service" }, 2026, new Date());
    expect(a.id).not.toBe(b.id); expect(a.slug).not.toBe(b.slug);
  });
  it("bounds unusually long story URLs deterministically", () => {
    const input = { ...draft, awardTitle: "An exceptionally long award title ".repeat(20) };
    const a = prepareWinner(input, 2026, new Date());
    expect(a.slug.length).toBeLessThanOrEqual(180);
    expect(a.slug).toBe(prepareWinner(input, 2026, new Date()).slug);
  });
  it("rejects incomplete articles and slug collisions before database writes", () => {
    const row = prepareWinner(draft, 2026, new Date());
    expect(() => validatePreparedWinners([row], [])).toThrow();
    expect(() => validatePreparedWinners([row], [{ ...row, id: "older-recipient" }])).toThrow("already owned");
    expect(() => validatePreparedWinners([row, row], [])).toThrow("Duplicate article slug");
  });
});
