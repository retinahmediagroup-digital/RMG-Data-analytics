import { cloneElement, isValidElement, type ReactElement } from "react";

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: boolean;
  errorMsg?: string;
  children: ReactElement<{ id?: string }>;
}

export function Field({ id, label, required, error, errorMsg, children }: FieldProps) {
  const input = isValidElement(children) ? cloneElement(children, { id }) : children;
  return (
    <div className={`field${error ? " error" : ""}`} id={`f-${id}`}>
      <label htmlFor={id}>
        {label} {required && <span className="req">*</span>}
      </label>
      {input}
      {errorMsg && <div className="msg">{errorMsg}</div>}
    </div>
  );
}
