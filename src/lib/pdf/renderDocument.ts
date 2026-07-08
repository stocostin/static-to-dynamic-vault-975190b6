import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

export type LineItem = {
  description: string;
  size?: string;
  unit?: string;
  qty: number;
  rate_cents: number;
};

export type DocumentData = {
  doc_type: "invoice" | "quotation" | "receipt" | "estimate";
  doc_number?: string | null;
  issue_date: string;
  due_date?: string | null;
  client_name: string;
  client_reg_no?: string | null;
  client_kra_pin?: string | null;
  client_address?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  project_name?: string | null;
  location?: string | null;
  line_items: LineItem[];
  currency: string;
  subtotal_cents: number;
  tax_enabled: boolean;
  tax_rate: number;
  tax_label: string;
  tax_cents: number;
  total_cents: number;
  notes?: string | null;
};

export type BrandSettings = {
  site_name: string;
  logo_url?: string | null;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  website_url?: string;
  document_footer_tagline?: string;
  document_prepared_by?: string;
  document_bank_details?: string;
};

const BROWN = rgb(0.31, 0.19, 0.11);
const GREEN = rgb(0.12, 0.42, 0.24);
const DARK = rgb(0.1, 0.1, 0.1);
const LIGHT = rgb(0.95, 0.95, 0.95);
const GREY = rgb(0.5, 0.5, 0.5);

const TITLES: Record<DocumentData["doc_type"], string> = {
  invoice: "INVOICE",
  quotation: "QUOTATION",
  receipt: "RECEIPT",
  estimate: "ESTIMATE",
};

function money(cents: number, currency: string) {
  const v = (cents / 100).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${v}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB");
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const abs = /^https?:/i.test(url)
      ? url
      : `${window.location.origin}/${url.replace(/^\//, "")}`;
    const res = await fetch(abs, { mode: "cors", cache: "no-store" });
    if (!res.ok) {
      console.warn("[pdf] logo fetch failed", abs, res.status);
      return null;
    }
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch (e) {
    console.warn("[pdf] logo fetch error", e);
    return null;
  }
}

// pdf-lib StandardFonts only support WinAnsi. Strip characters outside it so a
// stray emoji anywhere in the payload can't crash the whole render.
function safe(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/[\u2700-\u27BF\u2600-\u26FF\uE000-\uF8FF\u{1F000}-\u{1FFFF}]/gu, "")
    // Any remaining non-WinAnsi codepoints → "?"
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "?");
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color = DARK,
) {
  page.drawText(safe(text), { x, y, size, font, color });
}

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split(/\n/)) {
    const words = paragraph.split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        out.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    out.push(line);
  }
  return out;
}

export async function renderDocumentPdf(
  doc: DocumentData,
  brand: BrandSettings,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const margin = 40;
  let y = height - margin;

  // === HEADER: Logo + site name (left), brown band right ===
  const headerH = 90;
  // Right decorative brown band
  page.drawRectangle({
    x: width - 140,
    y: height - headerH - 10,
    width: 140,
    height: headerH + 10,
    color: BROWN,
  });
  page.drawRectangle({
    x: width - 140,
    y: height - headerH - 14,
    width: 140,
    height: 4,
    color: GREEN,
  });

  // Logo
  if (brand.logo_url) {
    const bytes = await fetchImageBytes(brand.logo_url);
    if (bytes) {
      let img;
      try {
        img = await pdf.embedPng(bytes);
      } catch {
        try {
          img = await pdf.embedJpg(bytes);
        } catch {
          img = null;
        }
      }
      if (img) {
        const maxH = 60;
        const scale = maxH / img.height;
        const w = img.width * scale;
        page.drawImage(img, { x: margin, y: y - maxH, width: w, height: maxH });
      }
    }
  }

  // Site name & tagline
  drawText(page, brand.site_name.toUpperCase(), margin + 80, y - 22, 18, bold, BROWN);
  const subTagline = brand.document_footer_tagline || "";
  if (subTagline) {
    drawText(page, subTagline.toUpperCase(), margin + 80, y - 40, 8, font, GREY);
  }

  y -= headerH + 10;

  // Green divider
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1.5,
    color: GREEN,
  });
  y -= 20;

  // === TITLE ===
  const title = TITLES[doc.doc_type];
  const titleWidth = bold.widthOfTextAtSize(title, 22);
  drawText(page, title, (width - titleWidth) / 2, y, 22, bold, DARK);
  // Underline
  page.drawLine({
    start: { x: (width - titleWidth) / 2, y: y - 4 },
    end: { x: (width + titleWidth) / 2, y: y - 4 },
    thickness: 1.5,
    color: GREEN,
  });
  y -= 30;

  // === Doc number + date ===
  if (doc.doc_number) drawText(page, doc.doc_number, margin, y, 10, bold);
  y -= 14;
  drawText(page, `Date: ${fmtDate(doc.issue_date)}`, margin, y, 10, bold);
  if (doc.due_date) {
    drawText(page, `Due: ${fmtDate(doc.due_date)}`, margin + 150, y, 10, bold);
  }
  y -= 22;

  // === Client block ===
  const lbl = (l: string, v?: string | null) => {
    if (!v) return;
    drawText(page, `${l}: `, margin, y, 10, bold);
    drawText(page, v, margin + bold.widthOfTextAtSize(`${l}: `, 10), y, 10, font);
    y -= 14;
  };
  lbl("CLIENT", doc.client_name);
  lbl("REG NO", doc.client_reg_no);
  lbl("PROJECT", doc.project_name);
  lbl("LOCATION", doc.location);
  lbl("KRA PIN", doc.client_kra_pin);
  if (doc.client_email || doc.client_phone) {
    const parts = [doc.client_phone, doc.client_email].filter(Boolean).join("  |  ");
    lbl("CONTACT", parts);
  }
  y -= 6;

  // === Line items table ===
  const cols = [
    { label: "No", w: 30, align: "center" as const },
    { label: "Description", w: 170, align: "left" as const },
    { label: "Size", w: 80, align: "left" as const },
    { label: "Unit", w: 40, align: "center" as const },
    { label: "Qty", w: 40, align: "center" as const },
    { label: "Rate", w: 70, align: "right" as const },
    { label: "Amount", w: 85, align: "right" as const },
  ];
  const tableX = margin;
  const tableW = cols.reduce((a, c) => a + c.w, 0);
  const rowH = 22;

  // Header row
  page.drawRectangle({
    x: tableX,
    y: y - rowH + 4,
    width: tableW,
    height: rowH,
    color: BROWN,
  });
  {
    let cx = tableX;
    for (const c of cols) {
      const tw = bold.widthOfTextAtSize(c.label, 10);
      const tx =
        c.align === "center"
          ? cx + (c.w - tw) / 2
          : c.align === "right"
            ? cx + c.w - tw - 6
            : cx + 6;
      drawText(page, c.label, tx, y - 10, 10, bold, rgb(1, 1, 1));
      cx += c.w;
    }
  }
  y -= rowH;

  // Rows
  doc.line_items.forEach((item, idx) => {
    const rowY = y - rowH + 4;
    if (idx % 2 === 0) {
      page.drawRectangle({
        x: tableX,
        y: rowY,
        width: tableW,
        height: rowH,
        color: LIGHT,
      });
    }
    const amount = item.qty * item.rate_cents;
    const vals = [
      String(idx + 1).padStart(2, "0"),
      item.description || "",
      item.size || "",
      item.unit || "",
      String(item.qty || 0),
      (item.rate_cents / 100).toFixed(2),
      (amount / 100).toFixed(2),
    ];
    let cx = tableX;
    cols.forEach((c, i) => {
      const f = i >= 4 ? mono : font;
      const s = 9.5;
      const text = vals[i];
      const tw = f.widthOfTextAtSize(text, s);
      const tx =
        c.align === "center"
          ? cx + (c.w - tw) / 2
          : c.align === "right"
            ? cx + c.w - tw - 6
            : cx + 6;
      drawText(page, text, tx, y - 14, s, f, DARK);
      cx += c.w;
    });
    // Row border
    page.drawLine({
      start: { x: tableX, y: rowY },
      end: { x: tableX + tableW, y: rowY },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= rowH;
  });

  // Table bottom border
  page.drawLine({
    start: { x: tableX, y: y + 4 },
    end: { x: tableX + tableW, y: y + 4 },
    thickness: 1,
    color: BROWN,
  });
  y -= 12;

  // === Totals ===
  const totalsX = tableX + tableW - 260;
  const drawTotal = (label: string, value: string, boldRow = false) => {
    const f = boldRow ? bold : font;
    const s = boldRow ? 12 : 10;
    drawText(page, label, totalsX, y, s, bold, boldRow ? DARK : GREY);
    const vw = f.widthOfTextAtSize(value, s);
    drawText(page, value, tableX + tableW - vw, y, s, f, boldRow ? BROWN : DARK);
    y -= 16;
  };
  drawTotal("Subtotal:", money(doc.subtotal_cents, doc.currency));
  if (doc.tax_enabled && doc.tax_cents > 0) {
    drawTotal(
      `${doc.tax_label} (${doc.tax_rate}%):`,
      money(doc.tax_cents, doc.currency),
    );
  }
  y -= 4;
  page.drawLine({
    start: { x: totalsX, y: y + 12 },
    end: { x: tableX + tableW, y: y + 12 },
    thickness: 1,
    color: BROWN,
  });
  drawTotal("TOTAL:", money(doc.total_cents, doc.currency), true);

  y -= 10;

  // === Notes ===
  if (doc.notes) {
    drawText(page, "NOTES:", margin, y, 10, bold, GREEN);
    y -= 14;
    const lines = wrapLines(doc.notes, font, 9, width - margin * 2);
    for (const line of lines) {
      if (y < 140) break;
      drawText(page, `• ${line}`, margin + 8, y, 9, font);
      y -= 12;
    }
  }

  // === Bank details ===
  if (brand.document_bank_details) {
    y -= 6;
    drawText(page, "BANK DETAILS:", margin, y, 10, bold, GREEN);
    y -= 14;
    const lines = wrapLines(brand.document_bank_details, font, 9, width - margin * 2);
    for (const line of lines) {
      if (y < 130) break;
      drawText(page, line, margin + 8, y, 9, font);
      y -= 12;
    }
  }

  // === Signatures ===
  const sigY = 110;
  const colW = (width - margin * 2) / 2;
  drawText(page, "Prepared By:", margin + 40, sigY + 30, 10, bold, GREEN);
  page.drawLine({
    start: { x: margin + 20, y: sigY + 20 },
    end: { x: margin + colW - 20, y: sigY + 20 },
    thickness: 0.7,
    color: DARK,
  });
  drawText(
    page,
    brand.document_prepared_by || brand.site_name,
    margin + 40,
    sigY + 6,
    10,
    bold,
  );
  drawText(page, "Authorized Signatory", margin + 40, sigY - 8, 9, font, GREY);

  drawText(page, "Approved By:", margin + colW + 40, sigY + 30, 10, bold, GREEN);
  page.drawLine({
    start: { x: margin + colW + 20, y: sigY + 20 },
    end: { x: width - margin - 20, y: sigY + 20 },
    thickness: 0.7,
    color: DARK,
  });
  drawText(
    page,
    "Client Signature & Stamp",
    margin + colW + 40,
    sigY + 6,
    9,
    font,
    GREY,
  );

  // === Footer contact bar ===
  const footY = 40;
  page.drawRectangle({
    x: 0,
    y: 20,
    width,
    height: 40,
    color: BROWN,
  });
  page.drawRectangle({
    x: 0,
    y: 60,
    width,
    height: 3,
    color: GREEN,
  });
  const bits: string[] = [];
  if (brand.contact_phone) bits.push(`Tel: ${brand.contact_phone}`);
  if (brand.contact_email) bits.push(`Email: ${brand.contact_email}`);
  if (brand.contact_address) bits.push(`Address: ${brand.contact_address}`);
  if (brand.website_url) bits.push(`Web: ${brand.website_url}`);
  const footerText = bits.join("   |   ");
  const ftw = font.widthOfTextAtSize(safe(footerText), 8.5);
  const safeText = ftw > width - 20 ? bits.slice(0, 3).join("  |  ") : footerText;
  const sw = font.widthOfTextAtSize(safe(safeText), 8.5);
  drawText(page, safeText, (width - sw) / 2, footY - 12, 8.5, font, rgb(1, 1, 1));

  if (brand.document_footer_tagline) {
    const tw = bold.widthOfTextAtSize(brand.document_footer_tagline, 9);
    drawText(
      page,
      brand.document_footer_tagline,
      (width - tw) / 2,
      70,
      9,
      bold,
      BROWN,
    );
  }

  return await pdf.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
