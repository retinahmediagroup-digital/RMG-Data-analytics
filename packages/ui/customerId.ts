const STORAGE_KEY = "prolife_customer_ids_v1";
const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I - avoids misreads when read aloud or handwritten

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function randomId(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  return `PL-${code}`;
}

function loadMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage unavailable (private browsing, quota) - the ID still works for this session.
  }
}

/**
 * Looks up the customer ID already assigned to this phone number and returns it, so a
 * repeat customer keeps the same ID across visits. Mints and stores a new random ID the
 * first time a phone number is seen. Only stable within one app's browser storage - see
 * the note in Retinah's App.tsx about moving this lookup server-side once the three apps
 * share a backend.
 */
export function getOrCreateCustomerId(phone: string): string {
  const key = normalizePhone(phone);
  if (!key) return randomId();

  const map = loadMap();
  if (map[key]) return map[key];

  const taken = new Set(Object.values(map));
  let id = randomId();
  while (taken.has(id)) id = randomId();

  map[key] = id;
  saveMap(map);
  return id;
}
