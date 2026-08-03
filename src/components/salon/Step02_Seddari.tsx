'use client';

import { useState, useEffect, useCallback } from 'react';
import { Seddari, OrderDraft, JunctionType } from '@/lib/types';
import SeddariDesignerSimple from './SeddariDesigner';
import { ArrowLeft, ArrowRight, Plus, RotateCw, Trash2, Copy, Ruler, Grid3X3, ZoomIn, ZoomOut, Undo } from 'lucide-react';

interface Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface DesignerSeddari extends Seddari {
  label: number;
}

export default function Step02_SeddariSimple({ draft, onChange, onNext, onBack }: Props) {
  const [seddars, setSeddars] = useState<DesignerSeddari[]>(
    draft.seddars.length > 0 ? draft.seddars.map((s, i) => ({ ...s, label: i + 1 })) : []
  );
  const [widthCm, setWidthCm] = useState(70);
  const [heightCm, setHeightCm] = useState<20 | 30 | 50>(30);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputLength, setInputLength] = useState('');
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState<DesignerSeddari[][]>([]);

  useEffect(() => {
    onChange({ seddars: seddars.map(({ label, ...s }) => s) });
  }, [seddars, onChange]);

  const selected = seddars.find((s) => s.id === selectedId);

  const saveHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-9), seddars.map((s) => ({ ...s }))]);
  }, [seddars]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setSeddars(prev.map((s, i) => ({ ...s, label: i + 1 })));
    setHistory((h) => h.slice(0, -1));
  };

  const handleAdd = (junction: JunctionType = 'none') => {
    const len = parseInt(inputLength, 10);
    if (!len || len < 50) return;
    saveHistory();
    const last = seddars[seddars.length - 1];
    const s: DesignerSeddari = {
      id: `sd-${Date.now()}`,
      length: len, width: widthCm, height: heightCm,
      junction,
      x: last ? (last.x ?? 350) + 140 : 350,
      y: last ? last.y ?? 200 : 200,
      angle: 0,
      label: seddars.length + 1,
    };
    setSeddars((prev) => [...prev, s]);
    setSelectedId(s.id);
    setInputLength('');
  };

  const handleDuplicate = (id: string) => {
    const o = seddars.find((s) => s.id === id);
    if (!o) return;
    saveHistory();
    const s: DesignerSeddari = { ...o, id: `sd-${Date.now()}`, x: (o.x ?? 350) + 60, y: (o.y ?? 200) + 60, label: seddars.length + 1 };
    setSeddars((prev) => [...prev, s]);
    setSelectedId(s.id);
  };

  const handleUpdate = (id: string, patch: Partial<DesignerSeddari>) => {
    setSeddars((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleRotate90 = (id: string) => {
    const s = seddars.find((x) => x.id === id);
    if (!s) return;
    handleUpdate(id, { angle: ((s.angle ?? 0) + 90) % 360 });
  };

  const handleDelete = (id: string) => {
    saveHistory();
    setSeddars((prev) => {
      const f = prev.filter((s) => s.id !== id);
      return f.map((s, i) => ({ ...s, label: i + 1 }));
    });
    if (selectedId === id) setSelectedId(null);
  };

  const totalFabric = seddars.reduce((sum, s) => sum + s.length + s.height * 2, 0);
  const formajaExtra = seddars.filter((s) => s.junction === 'formaja').length * 250;
  const totalM = ((totalFabric + formajaExtra) / 100).toFixed(2);

  const junctionBtn = (type: JunctionType, label: string, icon: string, color: string) => (
    <button
      key={type}
      onClick={() => selected && handleUpdate(selected.id, { junction: type })}
      disabled={!selected}
      className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-right text-xs font-bold transition ${
        selected?.junction === type ? 'border-[#1B5E3B] bg-[#F5F0E8]' : 'border-gray-100 hover:border-gray-200'
      } ${!selected ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span className="text-lg" style={{ color }}>{icon}</span>
      <span className="text-[#0D1F17]">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen flex-col bg-[#F5F0E8]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1B5E3B]/10 bg-white px-3 py-2">
        <button onClick={onBack} className="flex items-center gap-1 rounded-lg bg-[#F5F0E8] px-3 py-1.5 text-xs font-bold text-[#1B5E3B]">
          <ArrowRight className="h-3 w-3" /> رجوع
        </button>
        <h1 className="text-sm font-black text-[#0D1F17]">تصميم السدادر</h1>
        <div className="w-16" />
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="hidden w-48 shrink-0 flex-col gap-2 overflow-y-auto border-l border-[#1B5E3B]/10 bg-white p-3 md:flex">
          <p className="text-[10px] font-bold uppercase text-gray-400">عناصر التصميم</p>
          <div className="space-y-1.5">
            {junctionBtn('none', 'بدون ربط', '▭', '#9CA3AF')}
            {junctionBtn('formaja', 'فرماجة', '◿', '#C9A84C')}
            {junctionBtn('insert', 'ديوان', '▭', '#4A7C59')}
            {junctionBtn('wooden_box', 'صندوق خشبي', '▣', '#8B6914')}
          </div>

          <div className="mt-3 rounded-lg bg-[#F5F0E8] p-2.5">
            <p className="text-[10px] font-bold text-gray-500">الأبعاد العامة</p>
            <div className="mt-2 space-y-2">
              <div>
                <label className="text-[10px] text-gray-500">العرض</label>
                <input type="number" value={widthCm} onChange={(e) => setWidthCm(parseInt(e.target.value) || 70)}
                  className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-center text-xs font-bold text-[#0D1F17]" />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">الارتفاع</label>
                <select value={heightCm} onChange={(e) => setHeightCm(parseInt(e.target.value) as 20 | 30 | 50)}
                  className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-center text-xs font-bold text-[#0D1F17]">
                  <option value={20}>20 سم</option>
                  <option value={30}>30 سم</option>
                  <option value={50}>50 سم</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-auto rounded-lg bg-[#1B5E3B] p-2.5 text-white">
            <p className="text-[10px] opacity-80">مجموع الثوب</p>
            <p className="text-lg font-black">{totalM} م</p>
          </div>
        </div>

        {/* Center */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Toolbar */}
          <div className="flex items-center gap-1 border-b border-[#1B5E3B]/10 bg-white px-2 py-1.5">
            <button onClick={() => setShowGrid(!showGrid)} className={`rounded p-1.5 ${showGrid ? 'bg-[#1B5E3B] text-white' : 'text-gray-500 hover:bg-gray-100'}`}><Grid3X3 className="h-4 w-4" /></button>
            <button onClick={handleUndo} disabled={history.length === 0} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"><Undo className="h-4 w-4" /></button>
            <div className="h-5 w-px bg-gray-200" />
            <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="rounded p-1.5 text-gray-500 hover:bg-gray-100"><ZoomOut className="h-4 w-4" /></button>
            <span className="w-10 text-center text-xs font-bold text-[#0D1F17]">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))} className="rounded p-1.5 text-gray-500 hover:bg-gray-100"><ZoomIn className="h-4 w-4" /></button>
            {selected && (
              <>
                <div className="h-5 w-px bg-gray-200" />
                <button onClick={() => handleRotate90(selected.id)} className="flex items-center gap-1 rounded bg-[#C9A84C] px-2 py-1 text-xs font-bold text-white">
                  <RotateCw className="h-3 w-3" /> 90°
                </button>
                <button onClick={() => handleDuplicate(selected.id)} className="flex items-center gap-1 rounded bg-[#1B5E3B] px-2 py-1 text-xs font-bold text-white">
                  <Copy className="h-3 w-3" /> نسخ
                </button>
              </>
            )}
          </div>

          {/* Add input */}
          <div className="flex gap-2 bg-white px-3 py-2">
            <input type="number" value={inputLength} onChange={(e) => setInputLength(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={`طول سداري ${seddars.length + 1} (سم)`}
              className="flex-1 rounded-lg border-2 border-gray-200 px-3 py-2 text-sm font-bold text-[#0D1F17] placeholder:text-gray-400 focus:border-[#1B5E3B] focus:outline-none" />
            <button onClick={() => handleAdd()} disabled={!inputLength || parseInt(inputLength) < 50}
              className="flex items-center gap-1 rounded-lg bg-[#1B5E3B] px-4 py-2 text-sm font-bold text-white shadow disabled:opacity-40">
              <Plus className="h-4 w-4" /> إضافة
            </button>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden p-2">
            <SeddariDesignerSimple
              seddars={seddars}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={(id, x, y) => handleUpdate(id, { x, y })}
              onRotate={(id, angle) => handleUpdate(id, { angle })}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="hidden w-48 shrink-0 flex-col gap-2 overflow-y-auto border-r border-[#1B5E3B]/10 bg-white p-3 md:flex">
          {!selected ? (
            <p className="py-8 text-center text-xs text-gray-400">اختر سداري لعرض خصائصه</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B5E3B] text-lg font-black text-white">
                  {selected.label}
                </div>
              </div>

              <div className="space-y-1.5">
                {[
                  { label: 'الطول', value: selected.length },
                  { label: 'العرض', value: selected.width },
                  { label: 'الارتفاع', value: selected.height },
                ].map((d) => (
                  <div key={d.label} className="flex items-center justify-between rounded bg-[#F5F0E8] px-2.5 py-1.5">
                    <span className="text-[10px] text-gray-500">{d.label}</span>
                    <span className="text-xs font-bold text-[#0D1F17]">{d.value} سم</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="mb-1 text-[10px] font-bold text-gray-500">التدوير</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleRotate90(selected.id)} className="flex-1 rounded bg-[#C9A84C] py-1.5 text-xs font-bold text-white">90°</button>
                  <span className="rounded bg-[#F5F0E8] px-2 py-1.5 text-xs font-bold text-[#0D1F17]">{Math.round(selected.angle ?? 0)}°</span>
                </div>
              </div>

              <div>
                <p className="mb-1 text-[10px] font-bold text-gray-500">الربط</p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { type: 'none' as JunctionType, label: 'بدون' },
                    { type: 'formaja' as JunctionType, label: 'فرماجة' },
                    { type: 'insert' as JunctionType, label: 'ديوان' },
                    { type: 'wooden_box' as JunctionType, label: 'خشب' },
                  ].map((j) => (
                    <button key={j.type} onClick={() => handleUpdate(selected.id, { junction: j.type })}
                      className={`rounded border-2 py-1.5 text-[10px] font-bold transition ${
                        selected.junction === j.type ? 'border-[#1B5E3B] bg-[#F5F0E8] text-[#0D1F17]' : 'border-gray-100 text-gray-500'
                      }`}>
                      {j.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => handleDelete(selected.id)} className="flex w-full items-center justify-center gap-1.5 rounded border-2 border-red-200 bg-red-50 py-2 text-xs font-bold text-red-600">
                <Trash2 className="h-3 w-3" /> حذف
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between border-t border-[#1B5E3B]/10 bg-white px-4 py-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-bold text-[#1B5E3B]">{seddars.length} سداري</span>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-[#C9A84C]">{seddars.filter((s) => s.junction === 'formaja').length} فرماجة</span>
          <span className="text-gray-300">|</span>
          <span className="font-bold text-[#1B5E3B]">{totalM} م ثوب</span>
        </div>
        <button onClick={onNext} disabled={seddars.length === 0}
          className="flex items-center gap-1 rounded-lg bg-[#1B5E3B] px-4 py-1.5 text-xs font-bold text-white shadow disabled:opacity-40">
          التالي <ArrowLeft className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}