interface EngineSectionProps {
  safetyBufferPct: number;
  coverThresholdWeeks: number;
  onSafetyBufferChange: (v: number) => void;
  onCoverThresholdChange: (v: number) => void;
}

export function EngineSection({
  safetyBufferPct,
  coverThresholdWeeks,
  onSafetyBufferChange,
  onCoverThresholdChange,
}: EngineSectionProps) {
  return (
    <section id="engine">
      <div className="section-title">Allocation engine</div>
      <p className="section-cap">Tune how recommendations are calculated. Changes recalculate every chart and card below immediately.</p>
      <div className="enginecard">
        <div className="engine-row">
          <div>
            <div className="lbl">Safety buffer</div>
            <div className="desc">Extra cover added on top of average weekly demand.</div>
          </div>
          <div>
            <input
              id="safetyBuffer"
              type="number"
              min={0}
              max={100}
              value={safetyBufferPct}
              onChange={(e) => onSafetyBufferChange(Number(e.target.value))}
            />{" "}
            %
          </div>
        </div>
        <div className="engine-row">
          <div>
            <div className="lbl">Weeks-of-cover threshold</div>
            <div className="desc">Above this, a shop with no shortfall is flagged to reduce.</div>
          </div>
          <input
            id="coverThreshold"
            type="number"
            min={0}
            max={20}
            value={coverThresholdWeeks}
            onChange={(e) => onCoverThresholdChange(Number(e.target.value))}
          />
        </div>
      </div>
    </section>
  );
}
