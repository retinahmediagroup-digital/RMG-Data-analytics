import { useEffect, useState, type FormEvent, type ReactNode } from "react";

interface PasswordGateProps {
  password: string;
  storageKey: string;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * A client-side-only gate against a link being shared, indexed, or stumbled on
 * by accident. This is NOT real access control - the password ships inside this
 * app's JavaScript bundle, so anyone who opens dev tools and reads the built
 * file can find it. Real access control requires a server that checks identity
 * on every request (Supabase Auth + Row-Level Security - see Phase 3 of the
 * build plan); this exists only as a stopgap until that's wired up.
 */
export function PasswordGate({
  password,
  storageKey,
  title,
  description = "Enter the access code to continue.",
  children,
}: PasswordGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(storageKey) === "true");
    setChecked(true);
  }, [storageKey]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (input === password) {
      sessionStorage.setItem(storageKey, "true");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!checked) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="gate-wrap">
      <form className="gate-card" onSubmit={submit}>
        <h1>{title}</h1>
        <p>{description}</p>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          placeholder="Access code"
        />
        {error && <div className="gate-error">Incorrect code.</div>}
        <button type="submit">Continue</button>
      </form>
    </div>
  );
}
