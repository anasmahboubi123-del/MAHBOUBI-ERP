'use client';

import { useState, useRef, useCallback } from 'react';
import { Seddari } from '@/lib/types';
import { RotateCw, Trash2, Copy } from 'lucide-react';

interface DesignerSeddari extends Seddari {
  label: number;
}

interface Props {
  seddars: DesignerSeddari[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
  onRotate: (id: string, angle: number) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function snapAngle(angle: number): number {
  let best = angle, minDiff = Infinity;
  for (const s of SNAP_ANGLES) {
    const diff = Math.abs(((angle - s + 540) % 360) - 180);
    if (diff < minDiff) { minDiff = diff; best = s; }
  }
  return minDiff < 10 ? best : angle;
}

export default function SeddariDesignerSimple({ seddars, selectedId, onSelect, onMove, onRotate, onDelete, onDuplicate }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const rotRef = useRef<{ id: string; sa: number; sma: number; cx: number; cy: number } | null>(null);
  const [liveAngle, setLiveAngle] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getPt = useCallback((e: React.PointerEvent | PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (800 / r.width), y: (e.clientY - r.top) * (600 / r.height) };
  }, []);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect(id);
    const s = seddars.find((x) => x.id === id);
    if (!s) return;
    const p = getPt(e);
    dragRef.current = { id, dx: p.x - (s.x ?? 0), dy: p.y - (s.y ?? 0) };
    setIsDragging(false);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragRef.current) {
      setIsDragging(true);
      const p = getPt(e);
      onMove(dragRef.current.id, p.x - dragRef.current.dx, p.y - dragRef.current.dy);
    }
    if (rotRef.current) {
      const p = getPt(e);
      const r = rotRef.current;
      const ma = Math.atan2(p.y - r.cy, p.x - r.cx);
      const a = snapAngle(((r.sa + ((ma - r.sma) * 180) / Math.PI) + 360) % 360);
      setLiveAngle(Math.round(a));
      onRotate(r.id, a);
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    rotRef.current = null;
    setLiveAngle(null);
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleRotateDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const s = seddars.find((x) => x.id === id);
    if (!s) return;
    const cx = (s.x ?? 0) + s.width, cy = (s.y ?? 0) + s.length;
    const p = getPt(e);
    rotRef.current = { id, sa: s.angle ?? 0, sma: Math.atan2(p.y - cy, p.x - cx), cx, cy };
    setLiveAngle(Math.round(s.angle ?? 0));
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handleBgClick = (e: React.PointerEvent) => {
    // Only deselect if clicking on background (not on a seddari)
    if (e.target === svgRef.current || (e.target as Element).tagName === 'rect') {
      onSelect(null);
    }
  };

  const getCorners = (s: DesignerSeddari) => {
    const cx = (s.x ?? 0) + s.width, cy = (s.y ?? 0) + s.length;
    const w = s.width * 2, h = s.length * 2, a = toRad(s.angle ?? 0);
    return [
      { x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 },
      { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 },
    ].map((p) => ({ x: cx + p.x * Math.cos(a) - p.y * Math.sin(a), y: cy + p.x * Math.sin(a) + p.y * Math.cos(a) }));
  };

  const getFormaja = (prev: DesignerSeddari, curr: DesignerSeddari) => {
    const a = getCorners(prev), b = getCorners(curr);
    let md = Infinity, c1 = a[0], c2 = b[0];
    for (const x of a) for (const y of b) { const d = Math.hypot(x.x - y.x, x.y - y.y); if (d < md) { md = d; c1 = x; c2 = y; } }
    const mx = (c1.x + c2.x) / 2, my = (c1.y + c2.y) / 2;
    const dx = c2.x - c1.x, dy = c2.y - c1.y;
    const nx = -dy, ny = dx, ln = Math.hypot(nx, ny) || 1;
    return `${c1.x},${c1.y} ${mx + (nx / ln) * 40},${my + (ny / ln) * 40} ${c2.x},${c2.y}`;
  };

  const bounds = seddars.length > 0 ? {
    minX: Math.min(...seddars.map((s) => (s.x ?? 0) - s.width * 1.5)),
    maxX: Math.max(...seddars.map((s) => (s.x ?? 0) + s.width * 3)),
    minY: Math.min(...seddars.map((s) => (s.y ?? 0) - s.length * 1.5)),
    maxY: Math.max(...seddars.map((s) => (s.y ?? 0) + s.length * 3)),
  } : { minX: 0, maxX: 800, minY: 0, maxY: 600 };
  const pad = 80;
  const vbX = bounds.minX - pad;
  const vbY = bounds.minY - pad;
  const vbW = (bounds.maxX - bounds.minX) + pad * 2 || 800;
  const vbH = (bounds.maxY - bounds.minY) + pad * 2 || 600;

  return (
    <div className="relative w-full">
      {liveAngle !== null && (
        <div className="absolute top-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#1B5E3B] px-4 py-1 text-sm font-bold text-white shadow-lg">
          {liveAngle}°
        </div>
      )}
      <div className="w-full overflow-hidden rounded-xl border border-[#1B5E3B]/15 bg-[#FAF8F4]" style={{ aspectRatio: '4/3' }}>
        <svg ref={svgRef} viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`} className="h-full w-full touch-none select-none"
          onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onPointerDown={handleBgClick}>
          <defs>
            <pattern id="gs" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0L0 0 0 30" fill="none" stroke="#1B5E3B" strokeWidth="0.3" opacity="0.1" />
            </pattern>
            <filter id="sh"><feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.15" /></filter>
            <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F5F0E8" /><stop offset="100%" stopColor="#E0D8CC" /></linearGradient>
            <linearGradient id="fg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#E8C547" /><stop offset="100%" stopColor="#C9A84C" /></linearGradient>
            <linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A07820" /><stop offset="100%" stopColor="#6B4E0A" /></linearGradient>
            <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#5A9A6A" /><stop offset="100%" stopColor="#3D6B4A" /></linearGradient>
          </defs>
          <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="url(#gs)" />

          {seddars.map((s, i) => {
            if (s.junction !== 'formaja' || i === 0) return null;
            const prev = seddars[i - 1]; if (!prev) return null;
            return <polygon key={`f-${s.id}`} points={getFormaja(prev, s)} fill="url(#fg)" stroke="#B8941D" strokeWidth="1.5" opacity="0.85" />;
          })}

          {seddars.map((s) => {
            const pts = getCorners(s);
            const d = `M ${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')} Z`;
            const isSel = selectedId === s.id;
            const cx = (s.x ?? 0) + s.width, cy = (s.y ?? 0) + s.length;
            const isW = s.junction === 'wooden_box';
            const isD = s.junction === 'insert';

            return (
              <g key={s.id}>
                <path d={d} fill="#000" opacity="0.05" transform="translate(2,3)" pointerEvents="none" />
                <path d={d} fill={isW ? 'url(#wg)' : isD ? 'url(#dg)' : 'url(#sg)'}
                  stroke={isSel ? '#C9A84C' : isW ? '#5C3D00' : isD ? '#2D5A3A' : '#1B5E3B'}
                  strokeWidth={isSel ? 3 : 1.5} filter="url(#sh)" className="cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => handlePointerDown(e, s.id)} />
                <path d={d} fill="none" stroke="#000" strokeWidth="0.5" opacity="0.08" pointerEvents="none" />

                <circle cx={cx} cy={cy} r="14" fill="white" stroke={isSel ? '#C9A84C' : '#1B5E3B'} strokeWidth="2" filter="url(#sh)" pointerEvents="none" />
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fontWeight="900" fill="#0D1F17" pointerEvents="none">{s.label}</text>
                <text x={cx} y={cy + 28} textAnchor="middle" fontSize="9" fontWeight="700" fill={isW || isD ? '#fff' : '#1B5E3B'} opacity="0.9" pointerEvents="none">
                  {s.length >= 100 ? `${(s.length / 100).toFixed(2)}م` : `${s.length}سم`}
                </text>

                {isSel && (
                  <g>
                    <line x1={cx} y1={cy - s.length * 1.1} x2={cx} y2={cy - s.length * 1.1 - 12} stroke="#C9A84C" strokeWidth="2" strokeDasharray="3 2" pointerEvents="none" />
                    <circle cx={cx} cy={cy - s.length * 1.1 - 28} r="20" fill="#C9A84C" stroke="white" strokeWidth="2.5" filter="url(#sh)" className="cursor-pointer"
                      onPointerDown={(e) => handleRotateDown(e, s.id)} />
                    <g transform={`translate(${cx - 9}, ${cy - s.length * 1.1 - 37})`} pointerEvents="none"><RotateCw width={18} height={18} color="white" /></g>

                    <circle cx={cx + s.width * 1.1 + 26} cy={cy} r="18" fill="#DC2626" stroke="white" strokeWidth="2.5" filter="url(#sh)" className="cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} />
                    <g transform={`translate(${cx + s.width * 1.1 + 17}, ${cy - 9})`} pointerEvents="none"><Trash2 width={18} height={18} color="white" /></g>

                    <circle cx={cx - s.width * 1.1 - 26} cy={cy} r="18" fill="#1B5E3B" stroke="white" strokeWidth="2.5" filter="url(#sh)" className="cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); onDuplicate(s.id); }} />
                    <g transform={`translate(${cx - s.width * 1.1 - 35}, ${cy - 9})`} pointerEvents="none"><Copy width={18} height={18} color="white" /></g>

                    {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="#C9A84C" stroke="white" strokeWidth="2" pointerEvents="none" />)}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}