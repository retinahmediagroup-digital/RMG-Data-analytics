import { newId } from "./id";
import type { Shop } from "./types";

const STORAGE_KEY = "prolife_shops_v1";

/** The 15 shops with real August 2026 figures in seedData.ts - kept in sync with that list. */
export const DEFAULT_SHOPS: Shop[] = [
  "PD Bindura",
  "PD Bulawayo",
  "PD Chinhoyi",
  "PD Domboshava",
  "PD Epworth Chiremba",
  "PD Gweru",
  "PD Huruyadzo Chitungwiza",
  "PD Kadoma Rimuka",
  "PD Kuwadzana",
  "PD Kwekwe",
  "PD Machipisa",
  "PD Mbizo",
  "PD Murewa",
  "PD Mutare",
  "PD Norton",
].map((name) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name, active: true }));

/**
 * Reads this browser's saved shop directory, falling back to the shipped defaults the
 * first time. Same cross-origin caveat as products.ts: only Retinah's app writes here
 * today, via saveShops - once the three apps share a backend this becomes a fetch from
 * a `shops` table instead.
 */
export function loadShops(): Shop[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Storage unavailable or corrupt - fall through to defaults.
  }
  return DEFAULT_SHOPS;
}

export function saveShops(shops: Shop[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
  } catch {
    // Storage unavailable (private browsing, quota) - edits still work for this session.
  }
}

export function addShop(shops: Shop[], name: string): Shop[] {
  const trimmed = name.trim();
  return [...shops, { id: newId("s"), name: trimmed, active: true }];
}
