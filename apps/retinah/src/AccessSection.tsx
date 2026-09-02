interface AccessSectionProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function AccessSection({ enabled, onChange }: AccessSectionProps) {
  return (
    <section id="access">
      <div className="section-title">Client access control</div>
      <div className="toggle-row">
        <label className="switch">
          <input type="checkbox" checked={enabled} onChange={(e) => onChange(e.target.checked)} />
          <span className="slider"></span>
        </label>
        <div className="txt">
          <strong>ProDairy dashboard access</strong>
          <span>Turns their dashboard link on or off, e.g. if a subscription lapses.</span>
        </div>
        <span className={`status-pill ${enabled ? "on" : "off"}`}>{enabled ? "Active" : "Paused"}</span>
      </div>
    </section>
  );
}
