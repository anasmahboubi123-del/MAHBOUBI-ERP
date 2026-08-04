'use client';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Seddari, JunctionType } from '@/lib/types';
import { DEFAULTS, seddariFabricCm, fmtM } from '@/lib/calculations';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card'

const SCALE = 1.2; // بكسل لكل سنتيمتر

const junctionOptions: { value: JunctionType; label: string }[] = [
  { value: 'none', label: 'بدون ربط' },
  { value: 'formaja', label: '🔺 فورماجة' },
  { value: 'insert', label: '↪️ دخول سداري' },
  { value: 'wooden_box', label: '⬜ صندوق خشبي' }
];

/** المرحلة 2: تصميم الصالون بطريقة البناء بالقطع (Fabric.js) */
export default function SalonDesigner2D({
  seddars,
  onChange,
  onDrawing
}: {
  seddars: Seddari[];
  onChange: (s: Seddari[]) => void;
  onDrawing: (png: string) => void;
}) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fcRef = useRef<any>(null);
  const libRef = useRef<any>(null);
  const seddarsRef = useRef<Seddari[]>(seddars);
  const onChangeRef = useRef(onChange);
  const onDrawingRef = useRef(onDrawing);
  seddarsRef.current = seddars;
  onChangeRef.current = onChange;
  onDrawingRef.current = onDrawing;

  const [form, setForm] = useState({ length: 200, width: DEFAULTS.defaultWidth, height: 50 });
  const [readyFlag, setReadyFlag] = useState(0);

  function exportPng() {
    const fc = fcRef.current;
    if (!fc) return;
    fc.discardActiveObject();
    fc.renderAll();
    onDrawingRef.current(fc.toDataURL({ format: 'png' }));
  }

  /** إعادة رسم جميع السدادر على اللوحة */
  function redraw(list: Seddari[]) {
    const fc = fcRef.current;
    const f = libRef.current;
    if (!fc || !f) return;
    fc.clear();
    fc.setBackgroundColor('#faf7f2', () => {});
    list.forEach((s, i) => {
      const w = s.length * SCALE;
      const h = s.width * SCALE;
      const rect = new f.Rect({
        width: w,
        height: h,
        fill: '#e7d3a8',
        stroke: '#7c5807',
        strokeWidth: 2,
        rx: 6,
        ry: 6,
        originX: 'center',
        originY: 'center'
      });
      const label = new f.Text(`${i + 1}: ${s.length}×${s.width}×${s.height}`, {
        fontSize: 14,
        fill: '#5b4200',
        originX: 'center',
        originY: 'center',
        fontFamily: 'Tahoma'
      });
      const parts: any[] = [rect, label];
      if (s.junction === 'formaja') {
        parts.push(
          new f.Triangle({ width: 22, height: 22, fill: '#c0392b', left: w / 2 - 14, top: -h / 2 - 4, originX: 'center', originY: 'center' })
        );
      }
      if (s.junction === 'wooden_box') {
        parts.push(
          new f.Rect({ width: 20, height: 20, fill: '#8b5a2b', left: w / 2 - 12, top: -h / 2 - 4, originX: 'center', originY: 'center' })
        );
      }
      const group = new f.Group(parts, {
        left: s.x ?? 40 + i * 40,
        top: s.y ?? 40 + i * 50,
        angle: s.angle ?? 0,
        data: s.id,
        lockScalingX: true,
        lockScalingY: true,
        borderColor: '#b8860b',
        cornerColor: '#b8860b'
      });
      fc.add(group);
    });
    fc.renderAll();
    exportPng();
  }

  useEffect(() => {
    let disposed = false;
    (async () => {
      const mod: any = await import('fabric');
      const f = mod.fabric;
      if (disposed || fcRef.current || !canvasElRef.current) return;
      libRef.current = f;
      const fc = new f.Canvas(canvasElRef.current, {
        width: 760,
        height: 460,
        backgroundColor: '#faf7f2',
        selection: false
      });
      fc.on('object:modified', (e: any) => {
        const id = e.target?.data;
        if (!id) return;
        const updated = seddarsRef.current.map((s) =>
          s.id === id ? { ...s, x: e.target.left, y: e.target.top, angle: e.target.angle } : s
        );
        onChangeRef.current(updated);
        setTimeout(exportPng, 50);
      });
      fcRef.current = fc;
      setReadyFlag((v) => v + 1);
    })();
    return () => {
      disposed = true;
      fcRef.current?.dispose();
      fcRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // أول رسم بعد جاهزية اللوحة
  useEffect(() => {
    if (readyFlag > 0) redraw(seddarsRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyFlag]);

  function addSeddari() {
    if (form.length < 30) return toast.error('أدخل طولاً صحيحاً (30cm على الأقل)');
    const s: Seddari = {
      id: `${Date.now()}`,
      length: Number(form.length),
      width: Number(form.width),
      height: Number(form.height),
      junction: 'none'
    };
    const list = [...seddars, s];
    onChange(list);
    redraw(list);
    toast.success(`تمت إضافة السداري ${list.length} - اسحبه لمكانه`);
  }

  function patchSeddari(id: string, patch: Partial<Seddari>) {
    const list = seddars.map((s) => (s.id === id ? { ...s, ...patch } : s));
    onChange(list);
    redraw(list);
  }

  function removeSeddari(id: string) {
    const list = seddars.filter((s) => s.id !== id);
    onChange(list);
    redraw(list);
  }

  function rotateSelected() {
    const fc = fcRef.current;
    const obj = fc?.getActiveObject();
    if (!obj) return toast.error('اختر سدارياً من الرسم أولاً');
    const angle = ((obj.angle ?? 0) + 90) % 360;
    obj.rotate(angle);
    fc.renderAll();
    const updated = seddars.map((s) => (s.id === obj.data ? { ...s, angle } : s));
    onChange(updated);
    setTimeout(exportPng, 50);
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-3 font-bold">➕ إضافة سداري</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-sm font-semibold text-gray-600">الطول (cm)</span>
            <input type="number" dir="ltr" value={form.length} onChange={(e) => setForm({ ...form, length: Number(e.target.value) })} className="block w-28 rounded-xl border px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-gray-600">العرض (cm) ✏️</span>
            <input type="number" dir="ltr" value={form.width} onChange={(e) => setForm({ ...form, width: Number(e.target.value) })} className="block w-24 rounded-xl border px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-gray-600">الارتفاع (cm)</span>
            <select value={form.height} onChange={(e) => setForm({ ...form, height: Number(e.target.value) })} className="block rounded-xl border px-3 py-2">
              {DEFAULTS.heights.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </label>
          <Button onClick={addSeddari}>+ إضافة</Button>
          <Button variant="secondary" onClick={rotateSelected}>↻ تدوير 90°</Button>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <canvas ref={canvasElRef} className="rounded-xl border" />
        <p className="mt-2 text-sm text-gray-400">💡 اسحب كل سداري لترتيبه على شكل L أو U أو أي شكل حر. الرسم يُحفظ تلقائياً ويُرسل للخياط.</p>
      </Card>

      {seddars.map((s, i) => (
        <Card key={s.id} className="flex flex-wrap items-center gap-3">
          <span className="font-bold">سداري {i + 1}</span>
          <span className="text-sm text-gray-500">{s.length}×{s.width}×{s.height} cm</span>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-700">
            الثوب: {fmtM(seddariFabricCm(s))}
          </span>
          <select
            value={s.junction}
            onChange={(e) => patchSeddari(s.id, { junction: e.target.value as JunctionType })}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            {junctionOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {s.junction === 'insert' && (
            <select
              value={s.insertDirection ?? 'into_next'}
              onChange={(e) => patchSeddari(s.id, { insertDirection: e.target.value as Seddari['insertDirection'] })}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              <option value="into_next">يدخل في السداري الموالي</option>
              <option value="from_next">السداري الموالي يدخل فيه</option>
            </select>
          )}
          <button onClick={() => removeSeddari(s.id)} className="mr-auto rounded-lg bg-red-100 px-3 py-1">🗑️</button>
        </Card>
      ))}
    </div>
  );
}
