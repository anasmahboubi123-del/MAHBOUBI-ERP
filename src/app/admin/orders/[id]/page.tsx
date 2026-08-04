"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PrintModal } from "@/features/documents/components/PrintModal";
import type { DocumentType } from "@/features/order-center/types";

/* ─── Types ─── */
interface ChatMessage {
  id: string;
  sender: "manager" | "tailor";
  senderName: string;
  text: string;
  time: string;
  type?: "text" | "image";
  imageUrl?: string;
}

interface ProductionTaskUI {
  id: string;
  productName: string;
  productType: string;
  status: string;
  assignedToName?: string;
  priority: string;
  details?: any;
  dueDate?: string;
}

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  actor: string;
  completed: boolean;
}

interface PaymentUI {
  id: string;
  amount: number;
  method: string;
  type: string;
  date: string;
  notes?: string;
}

interface OrderItemUI {
  id: string;
  productType: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  thumbnailUrl?: string;
  details?: any;
  calculations?: any;
  lineNotes?: string;
}

/* ─── Helpers ─── */
const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  quotation: "bg-purple-500",
  waiting_deposit: "bg-yellow-500",
  confirmed: "bg-blue-500",
  production: "bg-indigo-500",
  tailor_working: "bg-pink-500",
  quality_check: "bg-orange-500",
  ready: "bg-green-500",
  delivered: "bg-emerald-600",
  invoiced: "bg-cyan-500",
  paid: "bg-green-600",
  cancelled: "bg-red-600",
  archived: "bg-gray-400",
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  quotation: "عرض سعر",
  waiting_deposit: "انتظار العربون",
  confirmed: "مؤكد",
  production: "قيد الإنتاج",
  tailor_working: "الخياط يعمل",
  quality_check: "فحص الجودة",
  ready: "جاهز",
  delivered: "مُسلّم",
  invoiced: "مفوتر",
  paid: "مدفوع",
  cancelled: "ملغي",
  archived: "مؤرشف",
};

const taskStatusLabels: Record<string, string> = {
  pending: "في الانتظار",
  in_progress: "قيد العمل",
  completed: "مكتمل",
  issue: "مشكلة",
};

const partTypeIcons: Record<string, string> = {
  salon: "🛋️",
  tapis: "🧶",
  wood: "🪵",
  foam: "🧽",
  khamiya: "🧵",
  accessoire: "📦",
};

const noteTemplates = ["جودة عالية", "عاجل", "تأكد من اللون", "مخاد إضافية", "لحايف"];

function getDaysLeft(deliveryDate: string | null): number {
  if (!deliveryDate) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deliveryDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatCurrency(n: number): string {
  return n?.toLocaleString("ar-MA", { minimumFractionDigits: 2 }) + " DH";
}

/* ─── Tabs Components ─── */
function TimelineTab({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-800 mb-6">📊 سير العمل</h3>
      <div className="relative pr-4">
        <div className="absolute right-2 top-0 bottom-0 w-0.5 bg-gray-200" />
        {events.map((ev, idx) => (
          <div key={ev.id} className="relative flex items-start gap-4 mb-8 last:mb-0">
            <div
              className={`absolute right-0 top-1 w-4 h-4 rounded-full border-2 border-white shadow ${
                ev.completed ? "bg-green-500" : idx === events.findIndex((e) => !e.completed) ? "bg-blue-500 animate-pulse" : "bg-gray-300"
              }`}
            />
            <div className="mr-8">
              <p className="text-sm text-gray-500">{ev.date}</p>
              <p className="font-semibold text-gray-800">{ev.title}</p>
              <p className="text-sm text-gray-600">{ev.actor}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatTab({ orderId, initialMessages }: { orderId: string; initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`order_chat_${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` },
        (payload) => {
          const msg = payload.new as any;
          const mapped: ChatMessage = {
            id: msg.id,
            sender: msg.sender_role === "admin" ? "manager" : "tailor",
            senderName: msg.sender_name || "—",
            text: msg.body || "",
            time: new Date(msg.created_at || "").toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" }),
            type: msg.attachment_url ? "image" : "text",
            imageUrl: msg.attachment_url || undefined,
          };
          setMessages((prev) => [...prev, mapped]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const onSend = async () => {
    if (!newMessage.trim()) return;
    const { error } = await supabase.from("messages").insert({
      order_id: orderId,
      sender_role: "admin",
      sender_name: "المدير",
      body: newMessage,
    });
    if (error) {
      alert("فشل إرسال الرسالة");
      return;
    }
    setNewMessage("");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800">💬 محادثة الطلبية</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "manager" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                msg.sender === "manager" ? "bg-[#1B5E38] text-white rounded-bl-none" : "bg-gray-100 text-gray-800 rounded-br-none"
              }`}
            >
              <p className="text-xs opacity-70 mb-1">{msg.senderName} ({msg.time})</p>
              {msg.type === "image" ? (
                <div className="bg-white/20 rounded-lg p-2 text-sm">📷 {msg.text}</div>
              ) : (
                <p className="text-sm leading-relaxed">{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
            placeholder="اكتب رسالة..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E38]"
          />
          <button onClick={onSend} className="px-5 py-2 bg-[#1B5E38] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition">
            إرسال ➤
          </button>
        </div>
      </div>
    </div>
  );
}

function MediaTab({ initialImages, initialNotes, orderId }: { initialImages: string[]; initialNotes: string[]; orderId: string }) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [notes, setNotes] = useState<string[]>(initialNotes);
  const [newNote, setNewNote] = useState("");

  const addNote = async () => {
    if (!newNote.trim()) return;
    const updated = [...notes, newNote];
    setNotes(updated);
    setNewNote("");
    await supabase.from("orders").update({ production_notes: updated.join("\n") }).eq("id", orderId);
  };

  const addTemplate = (tag: string) => setNewNote((prev) => (prev ? prev + "، " + tag : tag));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📸 صور الثوب الفعلي (للخياط)</h3>
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center text-2xl border border-gray-200">
              📷
            </div>
          ))}
          <button className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 hover:border-[#1B5E38] hover:text-[#1B5E38] transition">
            + إضافة
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📝 ملاحظات تقنية للخياط</h3>
        <ul className="space-y-2 mb-4">
          {notes.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
              <span className="text-[#1B5E38]">•</span>
              {note}
            </li>
          ))}
        </ul>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
            placeholder="أضف ملاحظة سريعة..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1B5E38]"
          />
          <button onClick={addNote} className="px-4 py-2 bg-[#1B5E38] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition">
            ➕ إضافة
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {noteTemplates.map((tag) => (
            <button
              key={tag}
              onClick={() => addTemplate(tag)}
              className="px-3 py-1.5 bg-[#F5F6E8] text-[#1B5E38] rounded-lg text-xs font-semibold border border-[#1B5E38]/20 hover:bg-[#1B5E38] hover:text-white transition"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductionTab({
  items,
  tasks,
  onRefresh,
}: {
  items: OrderItemUI[];
  tasks: ProductionTaskUI[];
  onRefresh: () => void;
}) {
  const [tailorName, setTailorName] = useState("");
  const [showAssignFor, setShowAssignFor] = useState<string | null>(null);

  const assignTailor = async (taskId: string, name: string) => {
    if (!name.trim()) return;
    await supabase
      .from("production_tasks")
      .update({
        assigned_to: "tailor-" + Date.now(),
        assigned_to_name: name,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .eq("id", taskId);
    setTailorName("");
    setShowAssignFor(null);
    onRefresh();
  };

  const completeTask = async (taskId: string) => {
    await supabase
      .from("production_tasks")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", taskId);
    onRefresh();
  };

  const sendWhatsApp = (phone: string, message: string) => {
    const url = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Products */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📦 المنتجات</h3>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{partTypeIcons[item.productType] || "📦"}</span>
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 font-bold">{item.productType}</span>
                    <h4 className="font-bold text-gray-800 mt-1">{item.productName}</h4>
                    {item.lineNotes && <p className="text-xs text-amber-600 mt-1">📝 {item.lineNotes}</p>}
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg text-[#1B5E38]">{formatCurrency(item.totalPrice)}</p>
                  <p className="text-xs text-gray-400">الكمية: {item.quantity}</p>
                </div>
              </div>
              {item.details && (
                <div className="mt-3 text-xs text-gray-600 grid grid-cols-2 gap-1">
                  {item.details.seddari && <span>📐 سداري: {item.details.seddari.lengthCm}×{item.details.seddari.widthCm} سم</span>}
                  {item.details.fabric && <span>🧵 قماش: {item.details.fabric.name}</span>}
                  {item.details.dimensions?.areaSqm && <span>📏 مساحة: {item.details.dimensions.areaSqm} م²</span>}
                  {item.calculations?.fabricLengthCm && <span>🧵 طول القماش: {item.calculations.fabricLengthCm.toFixed(0)} سم</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Production Tasks */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🪡 مهام الإنتاج</h3>
        {tasks.length === 0 && <p className="text-gray-400 text-sm">لا توجد مهام إنتاج. اضغط "تأكيد الطلب" لإنشائها.</p>}
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 rounded-xl border border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold">{task.productName}</p>
                  <p className="text-xs text-gray-500">{task.productType} · {taskStatusLabels[task.status]}</p>
                  {task.assignedToName && <p className="text-xs text-blue-600 mt-1">👤 مُسند إلى: {task.assignedToName}</p>}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : task.status === "in_progress"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {taskStatusLabels[task.status]}
                </span>
              </div>

              {task.status === "pending" && (
                <div className="mt-3">
                  {showAssignFor === task.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tailorName}
                        onChange={(e) => setTailorName(e.target.value)}
                        placeholder="اسم الخياط/النجار"
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                      <button
                        onClick={() => assignTailor(task.id, tailorName)}
                        className="px-4 py-2 bg-[#1B5E38] text-white rounded-lg text-sm font-bold"
                      >
                        إسناد
                      </button>
                      <button onClick={() => setShowAssignFor(null)} className="px-3 py-2 text-gray-500 text-sm">إلغاء</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAssignFor(task.id)}
                      className="px-4 py-2 bg-[#1B5E38] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition"
                    >
                      👤 إسناد لخياط/نجار
                    </button>
                  )}
                </div>
              )}

              {task.status === "in_progress" && (
                <button
                  onClick={() => completeTask(task.id)}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition"
                >
                  ✅ إكمال المهمة
                </button>
              )}

              {task.details?.notes && (
                <p className="mt-2 text-xs text-gray-500 bg-amber-50 p-2 rounded">📝 {task.details.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Suppliers / WhatsApp */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📞 موردين / واتساب</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => sendWhatsApp("0667747091", "مرحباً، أحتاج استفسار بخصوص طلبية")}
            className="p-4 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition text-right"
          >
            <p className="font-bold text-green-800">🧵 مورد قماش</p>
            <p className="text-xs text-green-600">0667-74-70-91 · اضغط للواتساب</p>
          </button>
          <button
            onClick={() => sendWhatsApp("0660000000", "مرحباً، أحتاج زربية")}
            className="p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition text-right"
          >
            <p className="font-bold text-blue-800">🧶 شركة الزرابي</p>
            <p className="text-xs text-blue-600">اضغط للاتصال بالشركة</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function FinancialTab({ order, payments }: { order: any; payments: PaymentUI[] }) {
  const [newPayment, setNewPayment] = useState({ amount: "", method: "cash", type: "partial", notes: "" });
  const [loading, setLoading] = useState(false);

  const addPayment = async () => {
    const amount = parseFloat(newPayment.amount);
    if (!amount || amount <= 0) return;
    setLoading(true);
    await supabase.from("payments").insert({
      order_id: order.id,
      amount,
      method: newPayment.method,
      type: newPayment.type,
      notes: newPayment.notes,
      date: new Date().toISOString(),
    });

    // Recalculate
    const { data: orderRow } = await supabase.from("orders").select("total_amount, deposit_amount").eq("id", order.id).single();
    if (orderRow) {
      const newDeposit = (orderRow.deposit_amount || 0) + amount;
      const newRemaining = Math.max(0, (orderRow.total_amount || 0) - newDeposit);
      const newStatus = newRemaining <= 0 ? "paid" : order.status;
      await supabase
        .from("orders")
        .update({ deposit_amount: newDeposit, remaining_amount: newRemaining, status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", order.id);
    }

    setNewPayment({ amount: "", method: "cash", type: "partial", notes: "" });
    setLoading(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-2xl border-2 border-[#C9A84C] overflow-hidden">
        <div className="p-4 bg-[#C9A84C]/10">
          <h3 className="font-bold text-lg flex items-center gap-2">💰 الملخص المالي</h3>
        </div>
        <div className="p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">المجموع الفرعي</span><span className="font-bold">{formatCurrency(order.subtotal || 0)}</span></div>
          {(order.discount_amount || 0) > 0 && <div className="flex justify-between text-red-600"><span>الخصم</span><span className="font-bold">-{formatCurrency(order.discount_amount)}</span></div>}
          {(order.delivery_cost || 0) > 0 && <div className="flex justify-between"><span className="text-gray-600">التوصيل</span><span className="font-bold">{formatCurrency(order.delivery_cost)}</span></div>}
          <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>الإجمالي</span><span className="text-[#C9A84C]">{formatCurrency(order.total_amount || 0)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">التسبيق</span><span className="font-bold">{formatCurrency(order.deposit_amount || 0)}</span></div>
          <div className="flex justify-between text-sm font-bold"><span className="text-gray-500">الباقي</span><span>{formatCurrency(order.remaining_amount || 0)}</span></div>
        </div>
      </div>

      {/* Payments History */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📋 سجل الدفعات</h3>
        {payments.length === 0 && <p className="text-gray-400 text-sm">لا توجد دفعات مسجلة.</p>}
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
              <div>
                <p className="font-bold text-sm">{p.type === "deposit" ? "عربون" : p.type === "full" ? "دفع كامل" : "دفعة جزئية"}</p>
                <p className="text-xs text-gray-500">{new Date(p.date).toLocaleDateString("ar-MA")} · {p.method}</p>
              </div>
              <span className="font-bold text-[#1B5E38]">{formatCurrency(p.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Payment */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">➕ إضافة دفعة</h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={newPayment.amount}
            onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
            placeholder="المبلغ"
            className="px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-[#1B5E38] text-left"
          />
          <select
            value={newPayment.method}
            onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
            className="px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-[#1B5E38]"
          >
            <option value="cash">نقدي</option>
            <option value="bank_transfer">تحويل بنكي</option>
            <option value="cheque">شيك</option>
            <option value="card">بطاقة</option>
          </select>
        </div>
        <div className="mt-3">
          <select
            value={newPayment.type}
            onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 outline-none focus:border-[#1B5E38]"
          >
            <option value="deposit">عربون</option>
            <option value="partial">دفعة جزئية</option>
            <option value="full">دفع كامل</option>
          </select>
        </div>
        <button
          onClick={addPayment}
          disabled={loading}
          className="w-full mt-3 py-3 bg-[#1B5E38] text-white rounded-xl font-bold hover:bg-[#14502d] transition disabled:opacity-50"
        >
          {loading ? "..." : "✅ تسجيل الدفعة"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ✅ FIX: PrintModal props adapter
   ═══════════════════════════════════════════ */
function PrintModalAdapter({
  order,
  items,
  onClose,
}: {
  order: any;
  items: OrderItemUI[];
  onClose: () => void;
}) {
  const [docType, setDocType] = useState<DocumentType>("devis");
  const [includePrices, setIncludePrices] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);

  const orderItemsForPrint = items.map((it) => ({
    id: it.id,
    orderItemId: it.id,
    productType: it.productType,
    productName: it.productName,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    totalPrice: it.totalPrice,
    details: it.details || {},
    thumbnailUrl: it.thumbnailUrl,
    addedAt: new Date().toISOString(),
  }));

  return (
    <PrintModal
      orderItems={orderItemsForPrint}
      orderNumber={String(order.order_number || order.id?.slice(0, 8))}
      customerName={order.customer_name || "—"}
      customerPhone={order.customer_phone || "—"}
      customerCity={order.customer_city}
      totalAmount={order.total_amount || 0}
      discountAmount={order.discount_amount || 0}
      depositAmount={order.deposit_amount || 0}
      deliveryCost={order.delivery_cost || 0}
      documentType={docType}
      printOptions={{
        documentType: docType,
        printVariant: "standard",
        language: "ar",
        includeProductionDetails: includeDetails,
        includePrices,
        includeCosts: false,
        includeSignatures: true,
        includeQrCode: false,
        includeStamp: false,
      }}
      onClose={onClose}
    />
  );
}

/* ─── Main Page ─── */
export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<OrderItemUI[]>([]);
  const [tasks, setTasks] = useState<ProductionTaskUI[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [payments, setPayments] = useState<PaymentUI[]>([]);
  const [activeTab, setActiveTab] = useState<"production" | "chat" | "media" | "timeline" | "financial">("production");
  const [showPrint, setShowPrint] = useState(false);

  const loadData = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      // Order + items + tasks + history + payments (single query)
      const { data: orderData } = await supabase
        .from("orders")
        .select("*, order_items(*), production_tasks(*), order_history(*), payments(*)")
        .eq("id", orderId)
        .single();

      if (orderData) {
        setOrder(orderData);
        setItems((orderData.order_items || []).map((it: any) => ({
          id: it.id,
          productType: it.product_type,
          productName: it.product_name,
          quantity: it.quantity,
          unitPrice: it.unit_price,
          totalPrice: it.total_price,
          thumbnailUrl: it.thumbnail_url,
          details: it.details || {},
          calculations: it.calculations || {},
          lineNotes: it.line_notes,
        })));
        setTasks((orderData.production_tasks || []).map((t: any) => ({
          id: t.id,
          productName: t.product_name,
          productType: t.product_type,
          status: t.status,
          assignedToName: t.assigned_to_name,
          priority: t.priority,
          details: t.details,
          dueDate: t.due_date,
        })));
        setPayments((orderData.payments || []).map((p: any) => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          type: p.type,
          date: p.date,
          notes: p.notes,
        })));
        setTimeline((orderData.order_history || []).map((h: any) => ({
          id: h.id,
          date: new Date(h.created_at).toLocaleDateString("ar-MA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
          title: h.description || h.action,
          actor: h.created_by_name || "النظام",
          completed: true,
        })));
      }

      // Messages (keep old table)
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      setMessages((msgs || []).map((m: any) => ({
        id: m.id,
        sender: m.sender_role === "admin" ? "manager" : "tailor",
        senderName: m.sender_name || "—",
        text: m.body || "",
        time: new Date(m.created_at || "").toLocaleTimeString("ar-MA", { hour: "2-digit", minute: "2-digit" }),
        type: m.attachment_url ? "image" : "text",
        imageUrl: m.attachment_url || undefined,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orderId]);

  const handleConfirm = async () => {
    if (!order) return;
    await supabase
      .from("orders")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", order.id);

    // Create production tasks if not exist
    const { data: existingTasks } = await supabase.from("production_tasks").select("id").eq("order_id", order.id);
    if (!existingTasks || existingTasks.length === 0) {
      for (const item of items) {
        await supabase.from("production_tasks").insert({
          order_id: order.id,
          order_item_id: item.id,
          product_name: item.productName,
          product_type: item.productType,
          status: "pending",
          priority: "normal",
          details: {
            fabric: item.details?.fabric,
            seddari: item.details?.seddari,
            dimensions: item.details?.dimensions,
            wood: item.details?.woodItems,
            foam: item.details?.foamSeddars,
            notes: item.lineNotes,
            images: item.details?.images || [],
          },
          due_date: order.delivery_expected_date || null,
        });
      }
    }

    // Log history
    await supabase.from("order_history").insert({
      order_id: order.id,
      status: "confirmed",
      action: "order_confirmed",
      description: "تم تأكيد الطلب وبدء الإنتاج",
      created_by_name: "المدير",
      created_at: new Date().toISOString(),
    });

    loadData();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    await supabase.from("order_history").insert({
      order_id: order.id,
      status: newStatus,
      action: "status_changed",
      description: `تم تغيير الحالة إلى ${statusLabels[newStatus] || newStatus}`,
      created_by_name: "المدير",
      created_at: new Date().toISOString(),
    });
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-[#1B5E38] font-bold animate-pulse">جاري تحميل بيانات الطلبية...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-4xl mb-4">❌</p>
          <p className="text-gray-500">الطلبية غير موجودة</p>
          <Link href="/admin/orders" className="text-[#1B5E38] underline mt-4 inline-block">العودة للقائمة</Link>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft(order.delivery_expected_date);
  const hasTapis = items.some((i) => i.productType === "tapis");

  // Images & notes from order_items details or order.production_notes
  let images: string[] = [];
  let notesArr: string[] = [];
  items.forEach((item) => {
    if (item.details?.images) images = [...images, ...item.details.images];
  });
  if (order.production_notes) {
    notesArr = order.production_notes.split("\n").filter(Boolean);
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${statusColors[order.status] || "bg-gray-500"}`}>
                  {statusLabels[order.status] || order.status}
                </span>
                {hasTapis && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">🧶 زربية</span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                أنشئ: {new Date(order.created_at).toLocaleString("ar-MA")} · البائع: {order.seller_id || "—"}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/admin/orders" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition">
                ← رجوع
              </Link>
              <button
                onClick={() => setShowPrint(true)}
                className="px-4 py-2 bg-[#C9A84C] text-white rounded-xl text-sm font-bold hover:bg-[#b8983f] transition"
              >
                🖨️ طباعة / مستندات
              </button>
              {order.status === "draft" && (
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-[#1B5E38] text-white rounded-xl text-sm font-bold hover:bg-[#14502d] transition"
                >
                  ✅ تأكيد الطلب
                </button>
              )}
            </div>
          </div>

          {/* Quick Status Change */}
          {order.status !== "draft" && order.status !== "cancelled" && (
            <div className="mt-4 flex flex-wrap gap-2">
              {["confirmed", "production", "tailor_working", "quality_check", "ready", "delivered", "paid"].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    order.status === s ? "bg-[#1B5E38] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {statusLabels[s]}
                </button>
              ))}
            </div>
          )}

          {/* Tapis Alert */}
          {hasTapis && order.status !== "delivered" && order.status !== "paid" && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
              <span className="text-2xl">📞</span>
              <div className="flex-1">
                <p className="font-bold text-blue-800 text-sm">تذكير: اتصال بشركة الزرابي</p>
                <p className="text-xs text-blue-600 mt-1">هذه الطلبية تحتوي على زربية. يجب الاتصال بالشركة قبل {daysLeft} أيام من التسليم.</p>
              </div>
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">👤 الزبون</p>
              <p className="font-bold text-gray-800">{order.customer_name || "—"}</p>
              <p className="text-xs text-gray-500">{order.customer_phone || "—"}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">💰 المبلغ</p>
              <p className="font-bold text-gray-800">{formatCurrency(order.total_amount || 0)}</p>
              <p className="text-xs text-gray-500">تسبيق: {formatCurrency(order.deposit_amount || 0)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">📅 التسليم</p>
              <p className="font-bold text-gray-800">{order.delivery_expected_date ? new Date(order.delivery_expected_date).toLocaleDateString("ar-MA") : "—"}</p>
              <p className={`text-xs ${daysLeft < 0 ? "text-red-500" : "text-green-600"}`}>
                {daysLeft < 0 ? `متأخر ${Math.abs(daysLeft)} يوم` : `متبقي ${daysLeft} أيام`}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">📦 المنتجات</p>
              <p className="font-bold text-gray-800">{items.length} منتجات</p>
              <p className="text-xs text-[#1B5E38]">{tasks.filter((t) => t.status === "completed").length}/{tasks.length} مهام مكتملة</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-200 mb-6 overflow-x-auto">
          {[
            { key: "production", label: "📦 الإنتاج والأجزاء" },
            { key: "financial", label: "💰 المالية" },
            { key: "chat", label: "💬 المحادثة" },
            { key: "media", label: "📸 صور وملاحظات" },
            { key: "timeline", label: "📊 سير العمل" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition ${
                activeTab === tab.key ? "bg-[#1B5E38] text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "production" && <ProductionTab items={items} tasks={tasks} onRefresh={loadData} />}
        {activeTab === "financial" && <FinancialTab order={order} payments={payments} />}
        {activeTab === "chat" && <ChatTab orderId={order.id} initialMessages={messages} />}
        {activeTab === "media" && <MediaTab initialImages={images} initialNotes={notesArr} orderId={order.id} />}
        {activeTab === "timeline" && <TimelineTab events={timeline} />}
      </div>

      {/* Print Modal */}
      {showPrint && (
        <PrintModalAdapter
          order={order}
          items={items}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}