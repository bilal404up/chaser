import { test } from "node:test";
import assert from "node:assert/strict";
import { formatUsd, parseAmountToCents } from "../lib/money";
import { isIsoDate, daysOverdue, daysBetween, todayIso } from "../lib/dates";
import { canAddOpenInvoice, canExport, FREE_OPEN_LIMIT } from "../lib/plan";
import { reminderText, suggestedTone, TONES } from "../lib/reminders";
import { toCsv, csvCell } from "../lib/csv";
import { validateInvoice } from "../lib/validate";

// ---- money ----
test("formats cents as dollars", () => {
  assert.equal(formatUsd(0), "$0.00");
  assert.equal(formatUsd(5), "$0.05");
  assert.equal(formatUsd(123456), "$1,234.56");
  assert.equal(formatUsd(100000000), "$1,000,000.00");
});

test("parses typed amounts and rejects bad ones", () => {
  assert.equal(parseAmountToCents("1,234.50"), 123450);
  assert.equal(parseAmountToCents("$99"), 9900);
  assert.equal(parseAmountToCents("99.5"), 9950);
  assert.equal(parseAmountToCents("0.01"), 1);
  for (const bad of ["", "0", "0.00", "-5", "1.234", "abc", "1e3", "1,2,3x", "1000000.01", "$"]) {
    assert.equal(parseAmountToCents(bad), null, `should reject ${JSON.stringify(bad)}`);
  }
});

// ---- dates ----
test("recognizes real calendar dates only", () => {
  assert.equal(isIsoDate("2024-02-29"), true, "leap day");
  assert.equal(isIsoDate("2023-02-29"), false, "not a leap year");
  assert.equal(isIsoDate("2024-13-01"), false);
  assert.equal(isIsoDate("2024-04-31"), false);
  assert.equal(isIsoDate("24-01-01"), false);
  assert.equal(isIsoDate(20240101), false);
  assert.equal(isIsoDate(undefined), false);
});

test("counts overdue days across month ends, years and leap years", () => {
  assert.equal(daysOverdue("2024-02-28", "2024-03-01"), 2, "leap year: Feb 29 exists");
  assert.equal(daysOverdue("2023-02-28", "2023-03-01"), 1);
  assert.equal(daysOverdue("2023-12-31", "2024-01-02"), 2);
  assert.equal(daysOverdue("2024-05-10", "2024-05-10"), 0, "due today is not late yet");
  assert.equal(daysOverdue("2024-05-11", "2024-05-10"), -1, "not due yet");
  assert.equal(daysBetween("2024-01-01", "2024-12-31"), 365, "2024 has 366 days");
  assert.equal(todayIso(new Date("2024-07-04T23:59:59Z")), "2024-07-04");
});

// ---- plan ----
test("free plan stops at five open invoices, pro does not", () => {
  assert.equal(canAddOpenInvoice("free", FREE_OPEN_LIMIT - 1), true);
  assert.equal(canAddOpenInvoice("free", FREE_OPEN_LIMIT), false);
  assert.equal(canAddOpenInvoice("pro", 500), true);
  assert.equal(canExport("free"), false);
  assert.equal(canExport("pro"), true);
});

// ---- reminders ----
const base = { clientName: "Dana Whitfield", amountCents: 125000, dueOn: "2024-03-01", daysOverdue: 9, senderName: "Bilal" };

test("each tone produces a different, specific message", () => {
  const texts = TONES.map((tone) => reminderText({ ...base, tone }));
  assert.equal(new Set(texts.map((t) => t.body)).size, 3);
  for (const t of texts) {
    assert.ok(t.body.includes("$1,250.00"), "amount");
    assert.ok(t.body.includes("Mar 1, 2024"), "due date");
    assert.ok(t.body.includes("9 days past its due date"));
    assert.ok(t.body.startsWith("Hi Dana,"), "first name only");
    assert.ok(t.body.trim().endsWith("Bilal"));
    assert.ok(!t.body.includes("—"), "no em dash");
  }
});

test("reminders never promise late fees, interest or legal action", () => {
  for (const tone of TONES) {
    const { body, subject } = reminderText({ ...base, tone });
    for (const banned of ["fee", "interest", "legal", "lawyer", "court", "collections", "penalty"]) {
      assert.ok(!`${subject} ${body}`.toLowerCase().includes(banned), `${tone} mentions ${banned}`);
    }
  }
});

test("wording handles one day late, due today and odd names", () => {
  assert.ok(reminderText({ ...base, tone: "friendly", daysOverdue: 1 }).body.includes("1 day past its due date"));
  assert.ok(reminderText({ ...base, tone: "friendly", daysOverdue: 0 }).body.includes("due today"));
  assert.ok(reminderText({ ...base, tone: "firm", clientName: "   " }).body.startsWith("Hi there,"));
});

test("suggested tone follows how late the invoice is", () => {
  assert.equal(suggestedTone(1), "friendly");
  assert.equal(suggestedTone(7), "friendly");
  assert.equal(suggestedTone(8), "firm");
  assert.equal(suggestedTone(29), "firm");
  assert.equal(suggestedTone(30), "final");
});

// ---- csv ----
test("csv quotes commas, quotes and newlines", () => {
  assert.equal(csvCell("Acme, Inc."), '"Acme, Inc."');
  assert.equal(csvCell('He said "pay"'), '"He said ""pay"""');
  assert.equal(csvCell("a\nb"), '"a\nb"');
  assert.equal(csvCell(42), "42");
});

test("csv neutralizes spreadsheet formulas", () => {
  for (const evil of ["=HYPERLINK(\"http://x\")", "+1+1", "-2+3", "@SUM(A1)"]) {
    assert.ok(csvCell(evil).replace(/^"/, "").startsWith("'"), `not neutralized: ${evil}`);
  }
  assert.equal(csvCell("normal"), "normal");
});

test("csv has a header, CRLF line endings and one line per row", () => {
  const out = toCsv(["Client", "Amount"], [["Acme, Inc.", "10.00"], ["B", "5.00"]]);
  assert.equal(out, 'Client,Amount\r\n"Acme, Inc.",10.00\r\nB,5.00\r\n');
});

// ---- validation ----
const good = { client_name: "Acme", amount_cents: 5000, issued_on: "2024-03-01", due_on: "2024-03-15", notes: "" };

test("accepts a good invoice and trims text", () => {
  const r = validateInvoice({ ...good, client_name: "  Acme  ", notes: "  hi  " });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.client_name, "Acme");
    assert.equal(r.value.notes, "hi");
  }
});

test("rejects bad invoices instead of coercing them", () => {
  const bad: Array<[string, unknown]> = [
    ["not an object", "x"],
    ["null", null],
    ["empty client", { ...good, client_name: "   " }],
    ["long client", { ...good, client_name: "x".repeat(121) }],
    ["numeric client", { ...good, client_name: 5 }],
    ["string amount", { ...good, amount_cents: "5000" }],
    ["fractional cents", { ...good, amount_cents: 50.5 }],
    ["zero amount", { ...good, amount_cents: 0 }],
    ["negative amount", { ...good, amount_cents: -1 }],
    ["huge amount", { ...good, amount_cents: 100000001 }],
    ["impossible date", { ...good, due_on: "2024-02-30" }],
    ["due before issued", { ...good, due_on: "2024-02-01" }],
    ["long notes", { ...good, notes: "x".repeat(501) }],
    ["notes not text", { ...good, notes: 7 }],
  ];
  for (const [name, input] of bad) assert.equal(validateInvoice(input).ok, false, name);
});
