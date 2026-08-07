"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, RotateCcw, Lock, Send, Printer } from "lucide-react";
import { OrderDraft, Seddari, CushionItem, DecorCushionItem } from "@/lib/types";
import PinLock from "@/components/ui/PinLock";

interface Step07Props {
  draft: OrderDraft;
  onChange: (patch: Partial<OrderDraft>) => void;
  onNext: () => void;
  onBack: () => void;
  onSendToManager?: (draft: OrderDraft) => void;
}

export default function Step07_Summary({ draft, onChange, onNext, onBack, onSendToManager }: Step07Props) {
  const [pinOpen, setPinOpen] = useState(false);
  const [pinAction, setPinAction] = useState<"editTotal" | "send" | null>(null);
  const [pinOk, setPinOk] = useState(false);
  const [manualTotalInput, setManualTotalInput] = useState("");

  /* ── حسابات كل مرحلة ── */

  // المرحلة 1: الثوب
  const fabric = draft.fabric;
  const fabricTotalM = (draft.stageTotals?.fabric || 0) / 100;
  const fabricCost = fabric ? fabricTotalM * fabric.price_per_meter : 0;

  // المرحلة 2: السدادر (العادية + الفورمجة)
  const seddars = draft.seddars;
  const normalSeddars = seddars.filter(s => s.type !== "formaja");
  const formajaSeddars = seddars.filter(s => s.type === "formaja");
  const seddarsFabricTotal = draft.seddarsFabricTotalOverride ?? draft.stageTotals?.fabric ?? 0;
  const seddarsFabricM = (seddarsFabricTotal / 100).toFixed(2);

  // المرحلة 3: خياطة السدادر (العادية + الفورمجة)
  const stitches = draft.sedariStitches;
  const stitchTotal = draft.stage3TotalOverride ?? stitches.reduce((s, x) => s + x.finalPrice, 0);

  // المرحلة 4: المخاد
  const cushions = draft.cushionItems;
  const calcCushionItemTotal = (c: CushionItem): number => {
    const stitchCost = c.count * c.stitchFinalPrice;
    const lwataCost = c.hasLwata ? c.count * c.lwataPrice : 0;
    return stitchCost + lwataCost;
  };
  const cushionsTotal = draft.stage4TotalOverride ?? cushions.reduce((sum, item) => sum + calcCushionItemTotal(item), 0);

  // المرحلة 5: الكيدور (بالقطعة فقط)
  const decor = draft.decorItems;
  const calcDecorItemTotal = (d: DecorCushionItem): number => {
    return d.count * d.stitchFinalPrice;
  };
  const decorTotal = draft.stage5TotalOverride ?? decor.reduce((sum, item) => sum + calcDecorItemTotal(item), 0);

  // المرحلة 6: الإضافات (لحايف + طابورية فقط)
  const extrasStage = draft.extrasStage;
  const extrasTotal = extrasStage
    ? (extrasStage.lhayef?.enabled ? (extrasStage.lhayef.totalOverride ?? (extrasStage.lhayef.lengthM * extrasStage.lhayef.pricePerMeter)) : 0)
    + (extrasStage.tabouria?.enabled ? (extrasStage.tabouria.totalOverride ?? (extrasStage.tabouria.count * extrasStage.tabouria.unitPrice)) : 0)
    : 0;

  // المجموع الكلي
  const calculatedTotal = fabricCost + stitchTotal + cushionsTotal + decorTotal + extrasTotal;
  const displayTotal = draft.totalOverride ?? calculatedTotal;

  /* ── تعديل المجموع ── */
  const handlePinSuccess = () => {
    setPinOk(true);
  };

  const handleSaveTotal = () => {
    const val = Number(manualTotalInput);
    if (val >= 0) {
      onChange({ totalOverride: val });
      setPinOpen(false);
      setPinOk(false);
      setPinAction(null);
    }
  };

  const handleSendToManager = () => {
    if (onSendToManager) {
      onSendToManager(draft);
    }
    onNext();
  };

  // عداد العرض
  const getSeddariDisplayIndex = (seddari: Seddari, allSeddars: Seddari[]): number => {
    const isFormaja = seddari.type === "formaja";
    const sameType = allSeddars.filter(s => s.type === seddari.type);
    const idx = sameType.findIndex(s => s.id === seddari.id);
    return idx + 1;
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      {/* ═══════ الهيدر ═══════ */}
      <div className="sticky top-0 z-30 border-b border-[#1B5E3B]/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع
          </button>

          <div className="text-center">
            <h1 className="text-xl font-bold text-[#0D1F17] md:text-2xl">
              📋 ملخص الطلبية
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              المراجعة النهائية قبل الإرسال
            </p>
          </div>

          <div className="w-20" />
        </div>
      </div>

      {/* ═══════ المحتوى ═══════ */}
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">

        {/* ═══ المرحلة 1: الثوب ═══ */}
        <Section title="🧵 1. الثوب" color="#1B5E3B">
          <DetailRow label="النوع" value={fabric?.name || "—"} />
          <DetailRow label="السعر" value={fabric ? `${fabric.price_per_meter.toLocaleString("fr-MA")} DH/متر` : "—"} />
          <DetailRow label="استهلاك الثوب" value={`${seddarsFabricM} متر`} />
          <DetailRow label="ثمن الثوب" value={`${fabricCost.toFixed(2)} DH`} />
        </Section>

        {/* ═══ المرحلة 2: السدادر ═══ */}
        <Section title="🛋️ 2. السدادر" color="#1B5E3B">
          {seddars.length === 0 ? (
            <p className="text-sm text-gray-400">لا توجد سدادر</p>
          ) : (
            <>
              {/* السدادر العادية */}
              {normalSeddars.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">السدادر العادية</p>
                  {normalSeddars.map((s, idx) => (
                    <div key={s.id} className="mb-2 rounded-lg bg-white/50 p-3">
                      <p className="font-bold text-sm text-[#0D1F17]">
                        سداري {idx + 1}: {s.length} × {s.width} × {s.height} سم
                      </p>
                      <p className="text-xs text-[#1B5E3B]">
                        استهلاك الثوب: {s.fabricConsumption} سم
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* الفورمجات */}
              {formajaSeddars.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold text-[#C9A84C] mb-2 uppercase tracking-wide">🌀 الفورمجات</p>
                  {formajaSeddars.map((s, idx) => (
                    <div key={s.id} className="mb-2 rounded-lg bg-[#FFF8E1] border border-[#C9A84C]/20 p-3">
                      <p className="font-bold text-sm text-[#C9A84C]">
                        🌀 فورمجة {idx + 1}: {s.length} سم
                      </p>
                      <p className="text-xs text-[#1B5E3B]">
                        استهلاك الثوب: {s.fabricConsumption} سم
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 flex justify-between items-center rounded-lg bg-[#F5F0E8] px-3 py-2">
                <span className="text-sm font-bold text-[#0D1F17]">مجموع استهلاك الثوب</span>
                <span className="font-extrabold text-[#1B5E3B]">{seddarsFabricM} متر</span>
              </div>
              {draft.seddarsFabricTotalOverride !== null && (
                <p className="text-xs text-amber-600 mt-1">⚠️ مُعدّل يدوياً بالمدير</p>
              )}
            </>
          )}
        </Section>

        {/* ═══ المرحلة 3: خياطة السدادر ═══ */}
        <Section title="✂️ 3. خياطة السدادر" color="#1B5E3B">
          {stitches.length === 0 ? (
            <p className="text-sm text-gray-400">لم تُختر خياطة</p>
          ) : (
            <>
              {stitches.map((s) => {
                const seddari = seddars.find(sd => sd.id === s.seddariId);
                const isFormaja = seddari?.type === "formaja";
                const idx = getSeddariDisplayIndex(seddari!, seddars);
                const label = isFormaja ? `🌀 فورمجة ${idx}` : `سداري ${idx}`;
                return (
                  <DetailRow
                    key={s.seddariId}
                    label={`${label}: ${s.styleName}`}
                    value={`${s.finalPrice.toLocaleString("fr-MA")} DH`}
                    highlight={s.finalPrice !== s.basePrice}
                  />
                );
              })}
              <div className="mt-2 flex justify-between items-center rounded-lg bg-[#F5F0E8] px-3 py-2">
                <span className="text-sm font-bold text-[#0D1F17]">المجموع</span>
                <span className="font-extrabold text-[#1B5E3B]">{stitchTotal.toLocaleString("fr-MA")} DH</span>
              </div>
              {draft.stage3TotalOverride !== null && (
                <p className="text-xs text-amber-600 mt-1">⚠️ مُعدّل يدوياً</p>
              )}
            </>
          )}
        </Section>

        {/* ═══ المرحلة 4: المخاد ═══ */}
        <Section title="🛏️ 4. المخاد" color="#1B5E3B">
          {cushions.length === 0 ? (
            <p className="text-sm text-gray-400">لا توجد مخاد</p>
          ) : (
            <>
              {cushions.map((c, idx) => {
                const stitchCost = c.count * c.stitchFinalPrice;
                const lwataCost = c.hasLwata ? c.count * c.lwataPrice : 0;
                const total = stitchCost + lwataCost;
                return (
                  <div key={c.id} className="mb-2 rounded-lg bg-white/50 p-3">
                    <p className="font-bold text-sm text-[#0D1F17]">
                      مخدة {idx + 1}: حجم {c.size}سم × {c.count}
                    </p>
                    <p className="text-xs text-gray-500">
                      خياطة: {c.stitchStyleName} ({c.stitchFinalPrice} DH/مخدة)
                    </p>
                    {c.hasLwata && (
                      <p className="text-xs text-gray-500">
                        لواط: {c.count} × {c.lwataPrice} DH = {lwataCost} DH
                      </p>
                    )}
                    <p className="text-xs font-bold text-[#1B5E3B]">
                      = {total.toLocaleString("fr-MA")} DH
                    </p>
                  </div>
                );
              })}
              <div className="mt-2 flex justify-between items-center rounded-lg bg-[#F5F0E8] px-3 py-2">
                <span className="text-sm font-bold text-[#0D1F17]">مجموع المخاد</span>
                <span className="font-extrabold text-[#1B5E3B]">{cushionsTotal.toLocaleString("fr-MA")} DH</span>
              </div>
              {draft.stage4TotalOverride !== null && (
                <p className="text-xs text-amber-600 mt-1">⚠️ مُعدّل يدوياً</p>
              )}
            </>
          )}
        </Section>

        {/* ═══ المرحلة 5: الكيدور ═══ */}
        <Section title="🌀 5. مخاد الكيدور" color="#1B5E3B">
          {decor.length === 0 ? (
            <p className="text-sm text-gray-400">لا توجد كيدور</p>
          ) : (
            <>
              {decor.map((d, idx) => {
                const total = d.count * d.stitchFinalPrice;
                return (
                  <div key={d.id} className="mb-2 rounded-lg bg-white/50 p-3">
                    <p className="font-bold text-sm text-[#0D1F17]">
                      كيدور {idx + 1}: {d.shapeName} × {d.count} قطعة
                    </p>
                    <p className="text-xs text-gray-500">
                      خياطة: {d.stitchStyleName} ({d.stitchFinalPrice} DH/قطعة)
                    </p>
                    <p className="text-xs font-bold text-[#1B5E3B]">
                      = {total.toLocaleString("fr-MA")} DH
                    </p>
                  </div>
                );
              })}
              <div className="mt-2 flex justify-between items-center rounded-lg bg-[#F5F0E8] px-3 py-2">
                <span className="text-sm font-bold text-[#0D1F17]">مجموع الكيدور</span>
                <span className="font-extrabold text-[#1B5E3B]">{decorTotal.toLocaleString("fr-MA")} DH</span>
              </div>
              {draft.stage5TotalOverride !== null && (
                <p className="text-xs text-amber-600 mt-1">⚠️ مُعدّل يدوياً</p>
              )}
            </>
          )}
        </Section>

        {/* ═══ المرحلة 6: الإضافات ═══ */}
        <Section title="➕ 6. الإضافات" color="#1B5E3B">
          {extrasStage?.lhayef?.enabled && (
            <DetailRow
              label={`اللحايف (${extrasStage.lhayef.lengthM} متر)`}
              value={`${(extrasStage.lhayef.totalOverride ?? (extrasStage.lhayef.lengthM * extrasStage.lhayef.pricePerMeter)).toFixed(2)} DH`}
            />
          )}
          {extrasStage?.tabouria?.enabled && (
            <DetailRow
              label={`الطابورية (${extrasStage.tabouria.count})`}
              value={`${(extrasStage.tabouria.totalOverride ?? (extrasStage.tabouria.count * extrasStage.tabouria.unitPrice)).toFixed(2)} DH`}
            />
          )}
          {(!extrasStage || (!extrasStage.lhayef?.enabled && !extrasStage.tabouria?.enabled)) && (
            <p className="text-sm text-gray-400">لا توجد إضافات</p>
          )}
          <div className="mt-2 flex justify-between items-center rounded-lg bg-[#F5F0E8] px-3 py-2">
            <span className="text-sm font-bold text-[#0D1F17]">مجموع الإضافات</span>
            <span className="font-extrabold text-[#1B5E3B]">{extrasTotal.toFixed(2)} DH</span>
          </div>
        </Section>

        {/* ═══ المجموع الكلي ═══ */}
        <div className="rounded-2xl border-2 border-[#C9A84C] bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>ثمن الثوب:</span>
              <span>{fabricCost.toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>خياطة السدادر:</span>
              <span>{stitchTotal.toLocaleString("fr-MA")} DH</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>المخاد:</span>
              <span>{cushionsTotal.toLocaleString("fr-MA")} DH</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>الكيدور:</span>
              <span>{decorTotal.toLocaleString("fr-MA")} DH</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>الإضافات:</span>
              <span>{extrasTotal.toFixed(2)} DH</span>
            </div>

            <div className="border-t border-dashed border-gray-200 my-1" />

            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-[#0D1F17]">المجموع الكلي:</span>
              <span className="text-3xl font-extrabold text-[#1B5E3B]">
                {displayTotal.toLocaleString("fr-MA")} DH
              </span>
            </div>

            {draft.totalOverride !== null && (
              <p className="text-xs text-amber-600 text-center">⚠️ المجموع مُعدّل يدوياً بالمدير</p>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setManualTotalInput(String(displayTotal.toFixed(2)));
                setPinAction("editTotal");
                setPinOpen(true);
                setPinOk(false);
              }}
              className="flex items-center justify-center gap-2 flex-1 rounded-xl border-2 border-[#C9A84C] bg-white py-3 text-sm font-bold text-[#C9A84C] hover:bg-[#F5F0E8] transition"
            >
              <Lock className="h-4 w-4" />
              تعديل المجموع
            </button>

            <button
              onClick={() => {
                setPinAction("send");
                setPinOpen(true);
                setPinOk(false);
              }}
              className="flex items-center justify-center gap-2 flex-1 rounded-xl bg-[#1B5E3B] py-3 text-sm font-bold text-white hover:bg-[#144d30] transition"
            >
              <Send className="h-4 w-4" />
              إرسال للمدير
            </button>
          </div>
        </div>
      </div>

      {/* ═══════ نافذة كود المدير ═══════ */}
      {pinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => { setPinOpen(false); setPinOk(false); setPinAction(null); }}
              className="absolute left-3 top-3 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 transition"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <h3 className="mb-4 text-center text-lg font-bold text-[#0D1F17]">
              {pinAction === "editTotal" ? "تعديل المجموع الكلي" : "إرسال للمدير"}
            </h3>

            {!pinOk ? (
              <div className="py-4">
                <p className="mb-4 text-center text-gray-600">أدخل كود المدير</p>
                <PinLock
                  role="admin"
                  onSuccess={handlePinSuccess}
                  onCancel={() => { setPinOpen(false); setPinOk(false); setPinAction(null); }}
                />
              </div>
            ) : pinAction === "editTotal" ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-[#F5F0E8] p-4 text-center border border-[#C9A84C]/20">
                  <p className="text-sm text-gray-500">المجموع الحالي</p>
                  <p className="mt-1 text-3xl font-bold text-[#1B5E3B]">
                    {displayTotal.toLocaleString("fr-MA")} DH
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                    المجموع الجديد (DH)
                  </label>
                  <input
                    type="number"
                    dir="ltr"
                    value={manualTotalInput}
                    onChange={(e) => setManualTotalInput(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg text-[#0D1F17] focus:border-[#1B5E3B] focus:outline-none focus:ring-2 focus:ring-[#1B5E3B]/20"
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleSaveTotal}
                  disabled={!manualTotalInput || Number(manualTotalInput) < 0}
                  className="w-full rounded-xl bg-[#1B5E3B] py-3 text-base font-bold text-white transition hover:bg-[#144d30] disabled:opacity-40"
                >
                  💾 حفظ
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-gray-600">هل أنت متأكد من إرسال الطلبية للمدير؟</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setPinOpen(false); setPinOk(false); }}
                    className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSendToManager}
                    className="flex-1 rounded-xl bg-[#1B5E3B] py-3 text-sm font-bold text-white"
                  >
                    تأكيد الإرسال
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── مساعدات ─── */
function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-lg font-bold" style={{ color }}>{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-bold ${highlight ? "text-amber-600" : "text-[#0D1F17]"}`}>{value}</span>
    </div>
  );
}