// Bağımlılıksız SVG: ciro alanı (area) + sipariş çubukları, son 30 gün.
type Point = { day: string; total: number; count: number };

export default function TrendChart({ data }: { data: Point[] }) {
  if (!data.length) return <p className="text-sm text-text-light">Veri yok.</p>;
  const W = 720, H = 180, pad = 24;
  const maxTotal = Math.max(1, ...data.map((d) => d.total));
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const x = (i: number) => pad + (i * (W - 2 * pad)) / Math.max(1, data.length - 1);
  const yT = (v: number) => H - pad - (v / maxTotal) * (H - 2 * pad);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${yT(d.total).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`;
  const barW = Math.max(1, (W - 2 * pad) / data.length - 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Son 30 gün ciro ve sipariş trendi">
      {data.map((d, i) => {
        const h = (d.count / maxCount) * (H - 2 * pad);
        return <rect key={d.day} x={x(i) - barW / 2} y={H - pad - h} width={barW} height={h} fill="#f2cc8f" opacity={0.6} rx={1} />;
      })}
      <path d={area} fill="#e07a5f" opacity={0.12} />
      <path d={line} fill="none" stroke="#e07a5f" strokeWidth={2} />
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#ece8e1" strokeWidth={1} />
    </svg>
  );
}
