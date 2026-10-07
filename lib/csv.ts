/** Cells that start with these can run as formulas when the file is opened in a spreadsheet. */
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: string | number): string {
  let s = String(value);
  if (FORMULA_START.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(header: string[], rows: Array<Array<string | number>>): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
