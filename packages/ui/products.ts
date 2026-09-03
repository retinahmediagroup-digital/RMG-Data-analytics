import { newId } from "./id";
import type { Product } from "./types";

const STORAGE_KEY = "prolife_products_v1";

/**
 * Shipped with the app so every product list starts populated. Retinah's catalog
 * (see ProductsSection) is the place new lines get added; this is only the seed.
 */
export const DEFAULT_PRODUCTS: Product[] = [{ id: "250ml-milk-pouch", name: "250ml Milk Pouch", active: true }];

/**
 * Reads this browser's saved catalog, falling back to the shipped defaults the
 * first time. Each app (Shop, Retinah, ProDairy) is a separate origin with its own
 * storage - only Retinah's app writes here today, via saveProducts. Once the three
 * apps share a backend (see the Retinah App.tsx note), this read should become a
 * fetch from a `products` table instead, with everything else here unchanged.
 */
export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Storage unavailable or corrupt - fall through to defaults.
  }
  return DEFAULT_PRODUCTS;
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    // Storage unavailable (private browsing, quota) - edits still work for this session.
  }
}

export function addProduct(products: Product[], name: string): Product[] {
  const trimmed = name.trim();
  return [...products, { id: newId("p"), name: trimmed, active: true }];
}
