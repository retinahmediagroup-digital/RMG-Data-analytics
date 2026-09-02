import { useEffect, useRef } from "react";
import { Chart, type ChartConfiguration } from "chart.js/auto";

// Chart.js's default axis/legend text (12px) reads small next to the rest of the
// enlarged UI - bump it once, globally, rather than repeating a font size in every
// chart's options.
Chart.defaults.font.size = 14;

/**
 * Thin React wrapper over Chart.js: creates the chart once per canvas, then
 * pushes new data/options into the existing instance on re-render instead of
 * recreating it (mirrors the create-once-then-.update() pattern the original
 * prototypes used).
 */
export function ChartCanvas({ config }: { config: ChartConfiguration }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current = new Chart(canvasRef.current, config);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data = config.data;
    if (config.options) chart.options = config.options;
    chart.update();
  }, [config]);

  return <canvas ref={canvasRef} />;
}
