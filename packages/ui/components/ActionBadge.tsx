import type { Action } from "../types";

export function ActionBadge({ action }: { action: Action }) {
  const className = action === "Increase" ? "badge up" : action === "Reduce" ? "badge down" : "badge flat";
  const label = action === "Increase" ? "Increase allocation" : action === "Reduce" ? "Reduce allocation" : "Maintain allocation";
  return <span className={className}>{label}</span>;
}
