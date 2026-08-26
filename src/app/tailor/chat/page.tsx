"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTailorAuth } from "@/hooks/useTailorAuth";
import {
  getMessages,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
  uploadChatMedia,
  formatTime,
} from "@/lib/supabase-tailors";
import type { ChatMessage } from "@/lib/supabase-tailors";
import {
  ArrowRight,
  Mic,
  Camera,
  Image as ImageIcon,
  Send,
  LogOut,
  Play,
  Pause,
  Volume2,
} from "lucide-react";

export default function TailorChatPage() {
  const { session, logout } = useTailorAuth();
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

  const tailorId = session?.tailor_id || "";
  const tailorName = session?.full_name || "";

  // جلب الرسائل عند الدخول
  useEffect(() => {
    if (!tailorId) return;
    loadMessages();
    markMessagesAsRead(tailorId, "admin-1");
  }, [tailorId]);

  // اشتراك Realtime
  useEffect(() => {
    if (!tailorId) return;
    const sub = subscribeToMessages((msg) => {
      // فلترة: الرسالة لي أو مني
      if (msg.sender_id === tailorId || msg.recipient_id === tailorId) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    });
    return () => {
      sub.unsubscribe();
    };
  }, [tailorId]);

  // تمرير لآخر رسالة
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    try {
      const msgs = await getMessages(tailorId);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSendText() {
    if (!newMsg.trim() || !tailorId) return;
    try {
      await sendMessage({
        sender_role: "tailor",
        sender_id: tailorId,
        sender_name: tailorName,
        recipient_id: "admin-1",
        body: newMsg.trim(),
        message_type: "text",
      } as Parameters<typeof sendMessage>[0]);
      setNewMsg("");
    } catch (err) {
      alert("فشل إرسال الرسالة");
    }
  }

  async function handleImage(file: File) {
    if (!tailorId) return;
    setUploading(true);
    try {
      const url = await uploadChatMedia(file, file.name, "images");
      await sendMessage({
        sender_role: "tailor",
        sender_id: tailorId,
        sender_name: tailorName,
        recipient_id: "admin-1",
        body: "صورة",
        message_type: "image",
        media_url: url,
        order_id: null,
        media_duration: null,
        media_size: file.size,
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

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        const dur = recordingTime;
        setUploading(true);
        try {
          const url = await uploadChatMedia(blob, `voice-${Date.now()}.webm`, "voice");
          await sendMessage({
            sender_role: "tailor",
            sender_id: tailorId,
            sender_name: tailorName,
            recipient_id: "admin-1",
            body: "رسالة صوتية",
            message_type: "voice",
            media_url: url,
            media_duration: dur,
            order_id: null,
            media_size: null,
            attachment_url: null,
            audio_url: null,
          });
        } catch (err) {
          alert("فشل إرسال الصوت");
        } finally {
          setUploading(false);
          setRecordingTime(0);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      alert("لا يمكن الوصول للميكروفون. يرجى السماح بالوصول.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
  }

  const formatDur = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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
          <div className="text-center">
            <h1 className="font-bold text-sm">المحادثة</h1>
            <p className="text-[10px] text-white/70">مع المدير</p>
          </div>
          <button
            onClick={logout}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
            title="خروج"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-32">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">
          {/* Messages */}
          <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto bg-[#E5DDD5]">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <MessageCircleIcon />
                <p className="text-[#6B7280] mt-2">لا توجد رسائل بعد. ابدأ المحادثة!</p>
              </div>
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
                    <div className="text-[10px] font-bold text-[#C9A84C] mb-1 flex items-center gap-1">
                      {msg.sender_name}
                      <span className="text-[#9CA3AF] font-normal">
                        • {formatTime(msg.created_at)}
                      </span>
                    </div>

                    {msg.message_type === "image" && msg.media_url && (
                      <img
                        src={msg.media_url}
                        alt="صورة"
                        className="rounded-lg max-w-full mb-1 max-h-48 object-cover cursor-pointer"
                        onClick={() => window.open(msg.media_url ?? undefined, "_blank")}
                      />
                    )}

                    {msg.message_type === "voice" && msg.media_url && (
                      <div className="flex items-center gap-2 bg-white/50 rounded-lg p-2 mb-1">
                        <Volume2 size={16} className="text-[#1B5E38]" />
                        <audio controls src={msg.media_url} className="w-40 h-8" />
                        {msg.media_duration && (
                          <span className="text-xs text-[#6B7280]">
                            {formatDur(msg.media_duration)}
                          </span>
                        )}
                      </div>
                    )}

                    {msg.message_type === "text" && (
                      <p className="leading-relaxed">{msg.body}</p>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#E5E7EB] bg-white">
            {isRecording ? (
              <div className="flex items-center gap-3 bg-red-50 p-3 rounded-xl border border-red-100">
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
                    title="رفع صورة"
                  >
                    <ImageIcon size={18} />
                  </button>
                  <button
                    onClick={startRecording}
                    className="w-10 h-10 flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6] rounded-full transition"
                    title="رسالة صوتية"
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
                  className="flex-1 p-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] text-sm text-[#1A1A1A] focus:ring-2 focus:ring-[#1B5E38] outline-none transition"
                />

                <button
                  onClick={handleSendText}
                  disabled={!newMsg.trim() || uploading}
                  className="px-4 py-3 bg-[#1B5E38] text-white rounded-xl hover:bg-[#2D7A4E] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            )}
            {uploading && (
              <p className="text-xs text-[#6B7280] mt-1 animate-pulse">جاري الإرسال...</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function MessageCircleIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#D1D5DB"
      strokeWidth="1.5"
      className="mx-auto"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}