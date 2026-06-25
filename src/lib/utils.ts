import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) return parsed.map((t) => String(t)).filter(Boolean);
  } catch {
    // legacy comma-separated
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export function stringifyTags(tags: string[]): string {
  return JSON.stringify(tags.map((t) => t.trim()).filter(Boolean));
}

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function relativeDate(date: Date | null | undefined): string {
  if (!date) return "never";
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff === -1) return "tomorrow";
  if (diff > 0) return `${diff} days ago`;
  return `in ${Math.abs(diff)} days`;
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function parseDateInput(value: FormDataEntryValue | null): Date | null {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
