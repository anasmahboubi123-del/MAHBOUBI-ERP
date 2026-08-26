"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTailorAuth } from "@/hooks/useTailorAuth";
import {
  supabase,
  getMessages,
  sendMessage,
  subscribeToMessages,
  uploadChatMedia,
  formatTime,
} from "@/lib/supabase-tailors";
import type { ChatMessage } from "@/lib/supabase-tailors";
import {
  ArrowRight,
  Mic,
  Image as ImageIcon,
  Send,
  Volume2,
  Package,
  Calendar,
  User,
  Phone,
  CheckCircle,
} from "lucide-react";

interface OrderDetail {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  status: string;
  delivery_date?: string;
  notes?: string;
  payload?: any;
  drawing_url?: string;
}

export default function TailorOrderDetailPage() {
  const { orderId } = useParams() as { orderId: string };
  const { session } = useTailorAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);

  const tailorId = session?.tailor_id || "";
  const tailorName = session?.full_name || "";

  // Component Unmount Cleanup (Hardware Tracks & Timers)
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Fetch Order
  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
  }, [orderId]);

  // Load Initial Messages
  useEffect(() => {
    if (!orderId || !tailorId) return;
    loadMessages();
  }, [orderId, tailorId]);

  // Realtime Subscription with Explicit Void Cleanup
  useEffect(() => {
    if (!tailorId || !orderId) return;

    const sub = subscribeToMessages((msg) => {
      if (msg.order_id === orderId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      if (sub && typeof sub.unsubscribe === "function") {
        void sub.unsubscribe();
      }
    };
  }, [tailorId, orderId]);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchOrder() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone, status, delivery_date, notes, payload, drawing_url")
        .eq("id", orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (err) {
      console.error("Error fetching order:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  }

  async function handleSendText() {
    if (!newMsg.trim() || !tailorId || !orderId) return;
    const bodyText = newMsg.trim();
    setNewMsg("");
    try {
      await sendMessage({
        sender_role: "tailor",
        sender_id: tailorId,
        sender_name: tailorName,
        recipient_id: "admin-1",
        order_id: orderId,
        body: bodyText,
        message_type: "text",
        media_url: null,
        media_duration: null,
        media_size: null,
        attachment_url: null,
        audio_url: null,
      });
    } catch (err) {
      alert("فشل إرسال الرسالة");
      setNewMsg(bodyText);
    }
  }

  async function handleImage(file: File) {
    if (!tailorId || !orderId) return;
    setUploading(true);
    try {
      const url = await uploadChatMedia(file, file.name, "images");
      await sendMessage({
        sender_role: "tailor",
        sender_id: tailorId,
        sender_name: tailorName,
        recipient_id: "admin-1",
        order_id: orderId,
        body: "صورة",
        message_type: "image",
        media_url: url,
        media_duration: null,
        media_size: null,
        attachment_url: null,
        audio_url: null,
      });
    } catch (err) {
      alert("فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());

        // Calculate actual duration via timestamp delta to avoid stale closure state
        const calculatedDuration = recordingStartTimeRef.current
          ? Math.round((Date.now() - recordingStartTimeRef.current) / 1000)
          : 0;

        setUploading(true);
        try {
          const url = await uploadChatMedia(blob, `voice-${Date.now()}.webm`, "voice");
          await sendMessage({
            sender_role: "tailor",
            sender_id: tailorId,
            sender_name: tailorName,
            recipient_id: "admin-1",
            order_id: orderId,
            body: "رسالة صوتية",
            message_type: "voice",
            media_url: url,
            media_duration: calculatedDuration,
            media_size: null,
            attachment_url: null,
            audio_url: null,
          });
        } catch (err) {
          alert("فشل إرسال الصوت");
        } finally {
          setUploading(false);
          setRecordingTime(0);
          recordingStartTimeRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      alert("لا يمكن الوصول للميكروفون");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  }

  async function completeWork() {
    try {
      await supabase.from("orders").update({ status: "completed" }).eq("id", orderId);
      await sendMessage({
        sender_role: "tailor",
        sender_id: tailorId,
        sender_name: tailorName,
        recipient_id: "admin-1",
        order_id: orderId,
        body: "✅ تم إنهاء العمل على هذه الطلبية",
        message_type: "text",
        media_url: null,
        media_duration: null,
        media_size: null,
        attachment_url: null,
        audio_url: null,
      });
      fetchOrder();
    } catch (err) {
      alert("فشل تحديث الحالة");
    }
  }

  const formatDur = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="animate-pulse text-[#1B5E38] font-bold">جاري التحميل...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <p className="text-[#6B7280]">الطلبية غير موجودة</p>
      </div>
    );
  }

  const p = order.payload || {};

  return (
    <div className="min-h-screen bg-[#FAFAF8]" dir="rtl">
      {/* Header */}
      <header className="bg-[#1B5E38] text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/tailor/dashboard"
            className="text-[#C9A84C] hover:text-white flex items-center gap-1 text-sm font-bold transition"
          >
            <ArrowRight size={18} />
            رجوع
          </Link>
          <h1 className="font-bold text-sm">
            طلبية #{order.order_number}
          </h1>
          <div className="w-8" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6 pb-32">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E7EB]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1B5E38]/10 flex items-center justify-center shrink-0">
              <User size={24} className="text-[#1B5E38]" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[#1A1A1A]">{order.customer_name}</h2>
              {order.customer_phone && (
                <p className="text-sm text-[#6B7280] mt-1 flex items-center gap-1">
                  <Phone size={14} />
                  {order.customer_phone}
                </p>
              )}
              {order.delivery_date && (
                <p className="text-sm text-[#6B7280] mt-1 flex items-center gap-1">
                  <Calendar size={14} />
                  تاريخ التسليم: {new Date(order.delivery_date).toLocaleDateString("ar-MA")}
                </p>
              )}
              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-md font-bold ${
                order.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : order.status === "in_progress"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {order.status === "completed" ? "مكتملة" : order.status === "in_progress" ? "قيد العمل" : "جديدة"}
              </span>
            </div>
          </div>
        </div>

        {/* Seddars Details */}
        {p.seddars && p.seddars.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E7EB]">
            <h3 className="font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
              <Package size={18} className="text-[#1B5E38]" />
              السدادر
            </h3>
            <div className="space-y-2">
              {p.seddars.map((s: any, i: number) => (
                <div key={i} className="bg-[#FAFAF8] rounded-xl p-3 text-sm">
                  <span className="font-bold">سداري {i + 1}:</span>{" "}
                  طول {s.length}سم × عرض {s.width}سم × ارتفاع {s.height}سم
                  {s.junction && (
                    <span className="text-[#6B7280] mr-2">
                      (الربط: {s.junction})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cushions */}
        {p.cushions && p.cushions.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E7EB]">
            <h3 className="font-bold text-[#1A1A1A] mb-3">🛏️ المخاد</h3>
            <div className="space-y-2">
              {p.cushions.map((c: any, i: number) => (
                <div key={i} className="bg-[#FAFAF8] rounded-xl p-3 text-sm flex gap-3">
                  <span className="font-bold">سداري {i + 1}:</span>
                  <span>{c.count || 0} وسادة</span>
                  <span className="text-[#6B7280]">الحجم: {c.size || "—"}سم</span>
                  <span>{c.stuffing ? "مع حشو" : "بدون حشو"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Notes */}
        {order.notes && (
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
            <h3 className="font-bold text-amber-800 mb-2">📝 ملاحظات المدير</h3>
            <p className="text-amber-900 leading-relaxed text-sm">{order.notes}</p>
          </div>
        )}

        {/* Chat Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
          <div className="bg-[#1B5E38] text-white p-4 font-bold flex items-center gap-2 text-sm">
            <MessageIcon />
            المحادثة
            <span className="text-xs font-normal opacity-70">(مع المدير)</span>
          </div>

          <div className="p-4 space-y-3 max-h-80 overflow-y-auto bg-[#E5DDD5]">
            {messages.length === 0 && (
              <p className="text-center text-[#6B7280] text-sm py-4">لا توجد رسائل بعد</p>
            )}
            {messages.map((msg) => {
              const isMine = msg.sender_role === "tailor";
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      isMine
                        ? "bg-white text-[#1A1A1A] rounded-br-none shadow-sm"
                        : "bg-[#DCF8C6] text-[#1A1A1A] rounded-bl-none shadow-sm"
                    }`}
                  >
                    <div className="text-[10px] font-bold text-[#C9A84C] mb-1">
                      {msg.sender_name} • {formatTime(msg.created_at)}
                    </div>
                    {msg.message_type === "image" && msg.media_url && (
                      <img
                        src={msg.media_url}
                        alt="صورة"
                        className="rounded-lg max-w-full mb-2 max-h-48 object-cover cursor-pointer"
                        onClick={() => window.open(msg.media_url!, "_blank")}
                      />
                    )}
                    {msg.message_type === "voice" && msg.media_url && (
                      <div className="flex items-center gap-2">
                        <Volume2 size={16} className="text-[#1B5E38]" />
                        <audio controls src={msg.media_url} className="w-40 h-8" />
                        {msg.media_duration != null && (
                          <span className="text-xs text-[#6B7280]">{formatDur(msg.media_duration)}</span>
                        )}
                      </div>
                    )}
                    {msg.message_type === "text" && <p className="leading-relaxed">{msg.body}</p>}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input Controls */}
          <div className="p-3 border-t border-[#E5E7EB] bg-white">
            {isRecording ? (
              <div className="flex items-center gap-3 bg-red-50 p-3 rounded-xl">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-600 font-bold flex-1 text-sm">
                  جاري التسجيل... {formatDur(recordingTime)}
                </span>
                <button
                  onClick={stopRecording}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition"
                >
                  إيقاف
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <div className="flex gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] rounded-full transition"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button
                    onClick={startRecording}
                    className="w-10 h-10 flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] rounded-full transition"
                  >
                    <Mic size={18} />
                  </button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImage(f);
                    e.target.value = "";
                  }}
                />
                <input
                  type="text"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                  placeholder="اكتب رسالة..."
                  className="flex-1 p-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] text-sm focus:ring-2 focus:ring-[#1B5E38] outline-none"
                />
                <button
                  onClick={handleSendText}
                  disabled={!newMsg.trim() || uploading}
                  className="px-4 py-3 bg-[#1B5E38] text-white rounded-xl hover:bg-[#2D7A4E] transition disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </div>
            )}
            {uploading && <p className="text-xs text-[#6B7280] mt-1 animate-pulse">جاري الإرسال...</p>}
          </div>
        </div>

        {/* Completion CTA */}
        {order.status !== "completed" && (
          <button
            onClick={completeWork}
            className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            أنهيت العمل - إرسال إشعار
          </button>
        )}
      </main>
    </div>
  );
}

function MessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}