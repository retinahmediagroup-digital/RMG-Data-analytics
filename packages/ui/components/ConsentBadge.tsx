import type { Consent } from "../types";

export function ConsentBadge({ consent }: { consent: Consent }) {
  return <span className={consent === "Yes" ? "badge yes" : "badge no"}>{consent || "—"}</span>;
}
