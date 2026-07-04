import { parse, HTMLElement } from "node-html-parser";

export { HTMLElement };

export function parseDoc(html: string): HTMLElement {
  return parse(html, {
    blockTextElements: { script: true, style: true, pre: true },
  });
}

export function escapeHtml(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function setInner(root: HTMLElement, sel: string, html: string): boolean {
  const el = root.querySelector(sel);
  if (!el) return false;
  el.set_content(html);
  return true;
}

export function setText(root: HTMLElement, sel: string, text: string): boolean {
  const el = root.querySelector(sel);
  if (!el) return false;
  el.set_content(escapeHtml(text));
  return true;
}

export function setAttr(
  root: HTMLElement,
  sel: string,
  attr: string,
  value: string,
): boolean {
  const el = root.querySelector(sel);
  if (!el) return false;
  el.setAttribute(attr, value);
  return true;
}

/** Replace or add a <meta name="X"> content attribute in <head>. */
export function setMeta(
  root: HTMLElement,
  attrName: "name" | "property",
  key: string,
  content: string,
): void {
  const el = root.querySelector(`meta[${attrName}="${key}"]`);
  if (el) {
    el.setAttribute("content", content);
    return;
  }
  const head = root.querySelector("head");
  if (head) {
    head.insertAdjacentHTML(
      "beforeend",
      `\n    <meta ${attrName}="${key}" content="${escapeHtml(content)}">`,
    );
  }
}

export function setTitle(root: HTMLElement, title: string): void {
  const el = root.querySelector("title");
  if (el) el.set_content(escapeHtml(title));
}
