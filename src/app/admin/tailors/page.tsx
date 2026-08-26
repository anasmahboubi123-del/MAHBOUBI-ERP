"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle, DollarSign, Calendar, Send,
  User, Save, CheckCircle, Clock, AlertCircle, Package,
  Scissors, Hash, ArrowRight, Plus, X, RefreshCw,
  Ban, Mic, Image as ImageIcon, Camera,
  Play, Pause, Volume2, Trash2
} from "lucide-react";
import {
  getTailors,
  getMessages,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
  uploadChatMedia,
  formatTime,
  supabase,
} from "@/lib/supabase-tailors";
import type { ChatMessage, Tailor } from "@/lib/supabase-tailors";

// ============================================================
// TYPES
// ============================================================
interface WorkItem {
  id: string; order_id: string; label: string; kind: string;
  qty: number; sewing_cost: number; created_at: string;
  order_code?: string; customer_name?: string;
}

interface WeeklyWage {
  id: string; tailor_id: string; week_start: string; week_end: string;
  total_sewing_cost: number; wage_amount: number; wage_percentage: number;
  status: "pending" | "paid"; paid_at?: string; paid_by?: string; notes?: string;
}

interface WeeklySummary {
  total_sewing_cost: number; total_orders: number;
  seddars: number; cushions: number; decor_cushions: number; formas: number;
  items: WorkItem[];
}

// ============================================================
// UTILS
// ============================================================
const C = { primary:"#1B5E38", primaryLight:"#2D7A4E", gold:"#C9A84C", goldLight:"#D4BA6A",
  cream:"#F5F0E8", creamDark:"#E8E0D0", dark:"#1A1A1A", gray:"#6B7280", lightGray:"#F3F4F6",
  white:"#FFFFFF", danger:"#DC2626", success:"#16A34A", warning:"#D97706", voice:"#8B5CF6" };

function getWeekBounds(d: Date = new Date()) {
  const day = d.getDay();
  const ds = day===5?-6:day===6?0:-(day+1);
  const de = day===5?-1:day===6?5:4-day;
  const s = new Date(d); s.setDate(d.getDate()+ds); s.setHours(0,0,0,0);
  const e = new Date(d); e.setDate(d.getDate()+de); e.setHours(23,59,59,999);
  return { start:s, end:e };
}
function fc(a: number) { return `${a.toFixed(2)} درهم`; }
function fsd(s: string) { return new Date(s).toLocaleDateString("ar-MA",{month:"short",day:"numeric"}); }
function ft(s: string) { return new Date(s).toLocaleTimeString("ar-MA",{hour:"2-digit",minute:"2-digit"}); }
function gdn(s: string) { return ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"][new Date(s).getDay()]; }
function fdur(sec: number) { const m=Math.floor(sec/60); const s=Math.floor(sec%60); return `${m}:${s.toString().padStart(2,"0")}`; }

// ============================================================
// UI COMPONENTS
// ============================================================
function TailorSelector({ tailors, selectedId, onSelect, unreadCounts }: { tailors: Tailor[]; selectedId: string; onSelect: (id: string) => void; unreadCounts: Record<string, number> }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {tailors.map((tailor) => {
        const isSelected = tailor.id === selectedId;
        const unread = unreadCounts[tailor.id] || 0;
        return (
          <button key={tailor.id} onClick={() => onSelect(tailor.id)} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all duration-200 shrink-0 ${isSelected ? "shadow-lg scale-[1.02]" : "hover:shadow-md hover:scale-[1.01] border-transparent"}`} style={{ backgroundColor: isSelected ? C.primary : C.white, borderColor: isSelected ? C.gold : "#E5E7EB" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ backgroundColor: isSelected ? C.gold : C.primaryLight, color: isSelected ? C.dark : C.white }}>{tailor.full_name.charAt(0)}</div>
            <div className="text-right">
              <h3 className="font-bold text-sm" style={{ color: isSelected ? C.white : C.dark }}>{tailor.full_name}</h3>
              <p className="text-xs opacity-70" style={{ color: isSelected ? C.cream : C.gray }}>{tailor.phone}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : C.lightGray, color: isSelected ? C.white : C.gray }}>{tailor.wage_percentage}%</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: tailor.is_active ? (isSelected ? "rgba(22,163,74,0.3)" : "rgba(22,163,74,0.1)") : (isSelected ? "rgba(220,38,38,0.3)" : "rgba(220,38,38,0.1)"), color: tailor.is_active ? C.success : C.danger }}>{tailor.is_active ? "نشط" : "غير نشط"}</span>
              </div>
            </div>
            {unread > 0 && <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: C.danger }}>{unread}</div>}
          </button>
        );
      })}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: { title: string; value: string; subtitle?: string; icon: any; color: string }) {
  return (
    <div className="rounded-2xl p-5 border transition-all hover:shadow-md" style={{ backgroundColor: C.white, borderColor: "#E5E7EB" }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-60 mb-1" style={{ color: C.gray }}>{title}</p>
          <p className="text-2xl font-bold" style={{ color: C.dark }}>{value}</p>
          {subtitle && <p className="text-xs mt-1 opacity-50" style={{ color: C.gray }}>{subtitle}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}><Icon size={24} style={{ color }} /></div>
      </div>
    </div>
  );
}

function WorkDetailRow({ item, index }: { item: WorkItem; index: number }) {
  const kc: Record<string, string> = { seddari: C.primary, cushion: C.gold, decor_cushion: "#8B5CF6", forma: C.warning, tadakhul: C.gray };
  const kl: Record<string, string> = { seddari: "سداري", cushion: "مخدة", decor_cushion: "مخدة ديكور", forma: "فورمة", tadakhul: "تداخل" };
  const color = kc[item.kind] || C.gray;
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md" style={{ backgroundColor: C.white, borderColor: "#E5E7EB" }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: color }}>{index + 1}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4 className="font-bold text-sm" style={{ color: C.dark }}>{item.label}</h4>
          <span className="text-[10px] px-2 py-0.5 rounded-full text-white shrink-0 font-medium" style={{ backgroundColor: color }}>{kl[item.kind] || item.kind}</span>
        </div>
        <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: C.gray }}>
          <span className="flex items-center gap-1"><Package size={12} /> {item.order_code}</span>
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: C.gray }} />
          <span className="flex items-center gap-1"><User size={12} /> {item.customer_name}</span>
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: C.gray }} />
          <span className="flex items-center gap-1"><Calendar size={12} /> {gdn(item.created_at)}</span>
        </div>
      </div>
      <div className="text-left shrink-0">
        <p className="font-bold text-sm" style={{ color: C.primary }}>{fc(item.sewing_cost * item.qty)}</p>
        <p className="text-[10px]" style={{ color: C.gray }}>{item.qty} × {fc(item.sewing_cost)}</p>
      </div>
    </div>
  );
}

function WageHistoryRow({ wage, tailorName, onPay }: { wage: WeeklyWage; tailorName: string; onPay?: () => void }) {
  const pending = wage.status === "pending";
  return (
    <div className="flex items-center gap-4 p-5 rounded-xl border transition-all hover:shadow-md" style={{ backgroundColor: C.white, borderColor: "#E5E7EB" }}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${pending ? "animate-pulse" : ""}`} style={{ backgroundColor: pending ? `${C.warning}15` : `${C.success}15` }}>
        {pending ? <Clock size={24} style={{ color: C.warning }} /> : <CheckCircle size={24} style={{ color: C.success }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4 className="font-bold text-sm" style={{ color: C.dark }}>أسبوع: {fsd(wage.week_start)} - {fsd(wage.week_end)}</h4>
          <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: pending ? C.warning : C.success }}>{pending ? "معلّق" : "مدفوع"}</span>
        </div>
        <p className="text-xs" style={{ color: C.gray }}>{wage.notes}</p>
        {wage.paid_at && <p className="text-xs mt-1" style={{ color: C.success }}>تم الدفع يوم {new Date(wage.paid_at).toLocaleDateString("ar-MA")} بواسطة {wage.paid_by}</p>}
      </div>
      <div className="text-left shrink-0">
        <p className="font-bold text-lg" style={{ color: C.primary }}>{fc(wage.wage_amount)}</p>
        <p className="text-xs" style={{ color: C.gray }}>من {fc(wage.total_sewing_cost)}</p>
      </div>
      {pending && onPay && <button onClick={onPay} className="px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:shadow-lg hover:scale-105 shrink-0" style={{ backgroundColor: C.gold }}>دفع</button>}
    </div>
  );
}

function WeekSelector({ selectedWeek, onChange }: { selectedWeek: Date; onChange: (d: Date) => void }) {
  const bounds = getWeekBounds(selectedWeek);
  const prev = () => { const d = new Date(selectedWeek); d.setDate(d.getDate() - 7); onChange(d); };
  const next = () => { const d = new Date(selectedWeek); d.setDate(d.getDate() + 7); onChange(d); };
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ backgroundColor: C.white, borderColor: "#E5E7EB" }}>
      <button onClick={prev} className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:shadow-md hover:bg-gray-50" style={{ backgroundColor: C.lightGray }}><ArrowRight size={20} style={{ color: C.dark }} /></button>
      <div className="flex-1 text-center">
        <p className="text-sm font-bold" style={{ color: C.dark }}>{fsd(bounds.start.toISOString())} - {fsd(bounds.end.toISOString())}</p>
        <p className="text-xs" style={{ color: C.gray }}>(السبت - الخميس)</p>
      </div>
      <button onClick={next} className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:shadow-md hover:bg-gray-50 rotate-180" style={{ backgroundColor: C.lightGray }}><ArrowRight size={20} style={{ color: C.dark }} /></button>
    </div>
  );
}

// ============================================================
// AUDIO PLAYER
// ============================================================
function AudioPlayer({ url, duration }: { url: string; duration?: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    return () => { audio.pause(); audio.src = ""; };
  }, [url]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const progress = duration && duration > 0 ? (currentTime / duration) * 100 : 0;
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ backgroundColor: `${C.voice}15`, minWidth: "200px" }}>
      <button onClick={toggle} className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0" style={{ backgroundColor: C.voice }}>{isPlaying ? <Pause size={14} /> : <Play size={14} />}</button>
      <div className="flex-1"><div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${C.voice}30` }}><div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: C.voice }} /></div></div>
      <span className="text-xs font-mono shrink-0" style={{ color: C.voice }}>{isPlaying ? fdur(currentTime) : fdur(duration || 0)}</span>
    </div>
  );
}

// ============================================================
// CHAT BUBBLE
// ============================================================
function ChatBubble({ msg, isAdmin }: { msg: ChatMessage; isAdmin: boolean }) {
  const isMine = isAdmin === (msg.sender_role === "admin");
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className={`flex ${isMine ? "justify-start" : "justify-end"} mb-4`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isMine ? "rounded-tr-sm" : "rounded-tl-sm"}`} style={{ backgroundColor: isMine ? C.primary : C.white, color: isMine ? C.white : C.dark, border: isMine ? "none" : `1px solid #E5E7EB` }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold opacity-80">{msg.sender_name}</span>
          <span className="text-xs opacity-50">{formatTime(msg.created_at)}</span>
          {!msg.is_read && !isMine && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: C.gold }} />}
        </div>
        {msg.message_type === "text" && <p className="text-sm leading-relaxed">{msg.body}</p>}
        {msg.message_type === "voice" && msg.media_url && <AudioPlayer url={msg.media_url} duration={msg.media_duration ?? undefined} />}
        {(msg.message_type === "image" || msg.message_type === "camera") && msg.media_url && (
          <div className="relative">
            {!imageLoaded && <div className="w-48 h-36 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.lightGray }}><RefreshCw size={24} className="animate-spin" style={{ color: C.gray }} /></div>}
            <img src={msg.media_url} alt="صورة" className={`max-w-64 max-h-48 rounded-xl object-cover cursor-pointer transition-all hover:opacity-90 ${imageLoaded ? "block" : "hidden"}`} onLoad={() => setImageLoaded(true)} onClick={() => window.open(msg.media_url!, "_blank")} />
            {msg.body && msg.body !== "صورة" && <p className="text-xs mt-2 opacity-80">{msg.body}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function TailorsManagementPage() {
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [selectedTailorId, setSelectedTailorId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"work" | "chat" | "wages" | "settings">("work");
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [wages, setWages] = useState<WeeklyWage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showPayConfirm, setShowPayConfirm] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<WeeklySummary | null>(null);
  const [showAddTailor, setShowAddTailor] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loadingTailors, setLoadingTailors] = useState(true);

  // New Tailor Form State
  const [newTailorData, setNewTailorData] = useState({
    full_name: "",
    phone: "",
    pin_code: "",
    wage_percentage: 40,
  });

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ADMIN_ID = "admin-1";

  const selectedTailor = tailors.find((t) => t.id === selectedTailorId);

  // Load tailors from Supabase
  useEffect(() => {
    async function loadTailors() {
      try {
        const data = await getTailors();
        setTailors(data);
        if (data.length > 0 && !selectedTailorId) {
          setSelectedTailorId(data[0].id);
        }
      } catch (err) {
        console.error("فشل جلب الخياطين:", err);
      } finally {
        setLoadingTailors(false);
      }
    }
    loadTailors();
  }, []);

  // Load work items, messages, wages when tailor changes
  useEffect(() => {
    if (!selectedTailorId) return;
    loadWorkItems();
    loadMessages();
    loadWages();
    setCalculationResult(null);
  }, [selectedTailorId]);

  // Scroll chat
  useEffect(() => {
    if (activeTab === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // Mark read when chat tab opened
  useEffect(() => {
    if (activeTab === "chat" && selectedTailorId) {
      setMessages(prev => prev.map(m => m.sender_id === selectedTailorId ? { ...m, is_read: true } : m));
      setUnreadCounts(prev => ({ ...prev, [selectedTailorId]: 0 }));
      markMessagesAsRead(selectedTailorId, ADMIN_ID);
    }
  }, [activeTab, selectedTailorId]);

  // Realtime subscription
  useEffect(() => {
    const sub = subscribeToMessages((msg) => {
      // Only show messages related to the selected tailor
      if (msg.sender_id === selectedTailorId || msg.recipient_id === selectedTailorId) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Update unread count if not on chat tab
        if (activeTab !== "chat" && msg.sender_id === selectedTailorId) {
          setUnreadCounts((prev) => ({ ...prev, [selectedTailorId]: (prev[selectedTailorId] || 0) + 1 }));
        }
      }
      // Also update unread for other tailors
      if (msg.sender_role === "tailor" && msg.sender_id !== selectedTailorId) {
        setUnreadCounts((prev) => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] || 0) + 1 }));
      }
    });

    return () => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    };
  }, [selectedTailorId, activeTab]);

  async function loadWorkItems() {
    try {
      const { data } = await supabase
        .from("order_items")
        .select("id, order_id, label, kind, qty, sewing_cost, created_at, orders!inner(order_code, customer_name)")
        .eq("tailor_id", selectedTailorId)
        .order("created_at", { ascending: false });

      const mapped: WorkItem[] = (data || []).map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        label: item.label,
        kind: item.kind,
        qty: item.qty,
        sewing_cost: item.sewing_cost,
        created_at: item.created_at,
        order_code: item.orders?.order_code,
        customer_name: item.orders?.customer_name,
      }));
      setWorkItems(mapped);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadMessages() {
    if (!selectedTailorId) return;
    try {
      const msgs = await getMessages(selectedTailorId);
      setMessages(msgs);
      // Count unread from tailor
      const unread = msgs.filter(m => m.sender_role === "tailor" && !m.is_read).length;
      setUnreadCounts(prev => ({ ...prev, [selectedTailorId]: unread }));
    } catch (err) {
      console.error(err);
    }
  }

  async function loadWages() {
    try {
      const { data } = await supabase
        .from("weekly_wages")
        .select("*")
        .eq("tailor_id", selectedTailorId)
        .order("week_start", { ascending: false });
      setWages(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  // Calculate
  const calcSummary = useCallback((): WeeklySummary => {
    const bounds = getWeekBounds(selectedWeek);
    const weekItems = workItems.filter((item) => { const d = new Date(item.created_at); return d >= bounds.start && d <= bounds.end; });
    let totalSewingCost = 0, seddars = 0, cushions = 0, decor_cushions = 0, formas = 0;
    const uniqueOrders = new Set<string>();
    for (const item of weekItems) {
      totalSewingCost += item.sewing_cost * item.qty;
      uniqueOrders.add(item.order_id);
      if (item.kind === "seddari") seddars += item.qty;
      else if (item.kind === "cushion") cushions += item.qty;
      else if (item.kind === "decor_cushion") decor_cushions += item.qty;
      else if (item.kind === "forma") formas += item.qty;
    }
    return { total_sewing_cost: totalSewingCost, total_orders: uniqueOrders.size, seddars, cushions, decor_cushions, formas, items: weekItems };
  }, [workItems, selectedWeek]);

  useEffect(() => {
    if (activeTab === "work") {
      setIsCalculating(true);
      setTimeout(() => { setCalculationResult(calcSummary()); setIsCalculating(false); }, 400);
    }
  }, [activeTab, selectedWeek, calcSummary]);

  // Send message
  const sendMsg = async (textOverride?: string, type: "text" | "voice" | "image" | "camera" = "text", mediaUrl?: string, duration?: number) => {
    const text = textOverride || newMessage;
    if (!text.trim() && !mediaUrl) return;
    if (!selectedTailorId) return;
    try {
      await sendMessage({
        sender_role: "admin",
        sender_name: "المدير",
        sender_id: ADMIN_ID,
        recipient_id: selectedTailorId,
        body: text.trim() || (type === "voice" ? "رسالة صوتية" : "صورة"),
        message_type: type,
        order_id: null,
        media_url: mediaUrl ?? null,
        media_duration: duration ?? null,
        media_size: null,
        attachment_url: null,
        audio_url: null,
      });
      if (!textOverride) setNewMessage("");
    } catch (err) {
      alert("فشل إرسال الرسالة");
    }
  };

  // ============================================================
  // FIXED: handleImage + handleVoice + handleCamera
  // ============================================================
  const handleImage = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await uploadChatMedia(file, `image-${Date.now()}.${file.name.split('.').pop()}`, "images");
      await sendMsg("", "image", url);
    } catch (err) {
      alert("فشل رفع الصورة");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVoice = async (blob: Blob, duration: number) => {
    setIsUploading(true);
    try {
      const url = await uploadChatMedia(blob, `voice-${Date.now()}.webm`, "voice");
      await sendMsg("رسالة صوتية", "voice", url, duration);
    } catch (err) {
      alert("فشل إرسال الصوت");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCamera = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const url = await uploadChatMedia(blob, `camera-${Date.now()}.jpg`, "camera");
      await sendMsg("", "camera", url);
    } catch (err) {
      alert("فشل رفع الصورة");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePayWage = async (wageId: string) => {
    try {
      await supabase.from("weekly_wages").update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_by: "المدير",
      }).eq("id", wageId);
      loadWages();
      setShowPayConfirm(null);
    } catch (err) {
      alert("فشل تحديث الحالة");
    }
  };

  const handleSaveWeeklyWage = async () => {
    if (!calculationResult || !selectedTailor) return;
    const bounds = getWeekBounds(selectedWeek);
    try {
      await supabase.from("weekly_wages").insert({
        tailor_id: selectedTailorId,
        week_start: bounds.start.toISOString().split("T")[0],
        week_end: bounds.end.toISOString().split("T")[0],
        total_sewing_cost: calculationResult.total_sewing_cost,
        wage_amount: calculationResult.total_sewing_cost * (selectedTailor.wage_percentage / 100),
        wage_percentage: selectedTailor.wage_percentage,
        status: "pending",
        notes: `طلبيات: ${calculationResult.total_orders} | سدادر: ${calculationResult.seddars} | مخاد: ${calculationResult.cushions} | ديكور: ${calculationResult.decor_cushions} | فورمات: ${calculationResult.formas}`,
      });
      loadWages();
      alert("✅ تم حفظ بيانات هذا الأسبوع في السجل بنجاح!");
    } catch (err) {
      alert("فشل الحفظ");
    }
  };

  const handleCreateTailor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("tailors")
        .insert({
          full_name: newTailorData.full_name,
          phone: newTailorData.phone,
          pin_code: newTailorData.pin_code,
          wage_percentage: newTailorData.wage_percentage,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setTailors((prev) => [...prev, data]);
        if (!selectedTailorId) setSelectedTailorId(data.id);
        setShowAddTailor(false);
        setNewTailorData({ full_name: "", phone: "", pin_code: "", wage_percentage: 40 });
      }
    } catch (err) {
      alert("فشل إضافة الخياط");
    }
  };

  const updateSelectedTailorField = (field: keyof Tailor, value: any) => {
    setTailors((prev) =>
      prev.map((t) => (t.id === selectedTailorId ? { ...t, [field]: value } : t))
    );
  };

  const handleUpdateTailor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTailor) return;
    try {
      const { error } = await supabase
        .from("tailors")
        .update({
          full_name: selectedTailor.full_name,
          phone: selectedTailor.phone,
          pin_code: selectedTailor.pin_code,
          wage_percentage: selectedTailor.wage_percentage,
          is_active: selectedTailor.is_active,
        })
        .eq("id", selectedTailor.id);

      if (error) throw error;
      alert("✅ تم تحديث بيانات الخياط بنجاح!");
    } catch (err) {
      alert("فشل تحديث بيانات الخياط");
    }
  };

  // Voice recorder
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
        handleVoice(blob, dur);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start(100);
      setIsRecording(true);
      timerRef.current = setInterval(() => { setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000)); }, 1000);
    } catch { alert("لا يمكن الوصول للميكروفون. يرجى السماح بالوصول."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
  };

  // Camera
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraOpen(true);
    } catch { alert("لا يمكن الوصول للكاميرا."); }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => { if (blob) handleCamera(blob); closeCamera(); }, "image/jpeg", 0.9);
  };

  const closeCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraOpen(false);
  };

  const tabs = [
    { id: "work" as const, label: "أعمال الأسبوع", icon: Scissors },
    { id: "chat" as const, label: "المحادثة", icon: MessageCircle },
    { id: "wages" as const, label: "الأجور", icon: DollarSign },
    { id: "settings" as const, label: "إعدادات الخياط", icon: Calendar },
  ];

  if (loadingTailors) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="animate-pulse text-[#1B5E38] font-bold">جاري تحميل البيانات...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFAF8" }} dir="rtl">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: C.dark }}>إدارة الخياطين</h1>
            <p className="text-sm mt-1" style={{ color: C.gray }}>متابعة أعمال الخياطين، المحادثات، وحساب الأجور الأسبوعية</p>
          </div>
          <button onClick={() => setShowAddTailor(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg hover:scale-105" style={{ backgroundColor: C.primary }}>
            <Plus size={18} /> إضافة خياط
          </button>
        </div>

        {/* Tailor Selector */}
        <div className="mb-6">
          <h2 className="text-sm font-bold mb-3 px-1" style={{ color: C.gray }}>اختر الخياط</h2>
          <TailorSelector tailors={tailors} selectedId={selectedTailorId} onSelect={setSelectedTailorId} unreadCounts={unreadCounts} />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${isActive ? "shadow-lg text-white" : "text-gray-500 hover:bg-white hover:shadow-md border border-transparent"}`} style={isActive ? { backgroundColor: C.primary } : { backgroundColor: C.white, borderColor: "#E5E7EB" }}>
                <Icon size={18} />{tab.label}
                {tab.id === "chat" && (unreadCounts[selectedTailorId] || 0) > 0 && (
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white" style={{ backgroundColor: C.danger }}>{unreadCounts[selectedTailorId]}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB: WORK */}
        {activeTab === "work" && (
          <div className="space-y-6">
            <WeekSelector selectedWeek={selectedWeek} onChange={setSelectedWeek} />
            {isCalculating ? (
              <div className="flex items-center justify-center py-20 rounded-2xl border" style={{ backgroundColor: C.white, borderColor: "#E5E7EB" }}>
                <RefreshCw className="animate-spin ml-3" size={28} style={{ color: C.primary }} />
                <span className="font-bold" style={{ color: C.primary }}>جاري حساب أعمال الأسبوع...</span>
              </div>
            ) : calculationResult ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="إجمالي تكلفة الخياطة" value={fc(calculationResult.total_sewing_cost)} subtitle={`${calculationResult.total_orders} طلبية`} icon={Scissors} color={C.primary} />
                  <StatCard title="السدادر" value={String(calculationResult.seddars)} subtitle="قطعة" icon={Package} color={C.gold} />
                  <StatCard title="المخاد" value={String(calculationResult.cushions)} subtitle="مخدة" icon={Hash} color="#8B5CF6" />
                  <StatCard title="صافي الأجر" value={fc(calculationResult.total_sewing_cost * (selectedTailor?.wage_percentage || 40) / 100)} subtitle={`نسبة ${selectedTailor?.wage_percentage || 40}%`} icon={DollarSign} color={C.success} />
                </div>
                <div className="flex justify-end">
                  <button onClick={handleSaveWeeklyWage} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:scale-105" style={{ backgroundColor: C.gold }}>
                    <Save size={20} /> حفظ بيانات هذا الأسبوع في السجل
                  </button>
                </div>
                <div className="rounded-2xl border p-6" style={{ backgroundColor: C.white, borderColor: "#E5E7EB" }}>
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: C.dark }}><Package size={22} style={{ color: C.primary }} /> تفاصيل الأعمال ({calculationResult.items.length} بند)</h3>
                  {calculationResult.items.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">لا توجد أعمال مسجلة لهذا الخياط خلال هذا الأسبوع.</div>
                  ) : (
                    <div className="space-y-3">
                      {calculationResult.items.map((item, idx) => <WorkDetailRow key={item.id} item={item} index={idx} />)}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* TAB: CHAT */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-[650px] rounded-2xl border overflow-hidden" style={{ backgroundColor: C.white, borderColor: "#E5E7EB" }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: C.lightGray, borderColor: "#E5E7EB" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: C.primary }}>
                  {selectedTailor?.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: C.dark }}>{selectedTailor?.full_name}</h3>
                  <p className="text-xs" style={{ color: C.gray }}>{selectedTailor?.phone}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF8F5]">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-sm">لا توجد رسائل سابقة. ابدأ المحادثة الآن!</div>
              ) : (
                messages.map((m) => <ChatBubble key={m.id} msg={m} isAdmin={true} />)
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t bg-white flex items-center gap-2" style={{ borderColor: "#E5E7EB" }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImage(file);
                  e.target.value = "";
                }}
              />
              <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="p-2.5 rounded-xl hover:bg-gray-100 transition-all text-gray-600 disabled:opacity-50">
                <ImageIcon size={20} />
              </button>

              <button onClick={openCamera} disabled={isUploading} className="p-2.5 rounded-xl hover:bg-gray-100 transition-all text-gray-600 disabled:opacity-50">
                <Camera size={20} />
              </button>

              {isRecording ? (
                <div className="flex-1 flex items-center justify-between bg-red-50 px-4 py-2 rounded-xl border border-red-200">
                  <div className="flex items-center gap-2 text-red-600 font-medium text-sm animate-pulse">
                    <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                    جاري التسجيل... ({fdur(recordingDuration)})
                  </div>
                  <button onClick={stopRecording} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">
                    إنهاء وإرسال
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={startRecording} disabled={isUploading} className="p-2.5 rounded-xl hover:bg-gray-100 transition-all text-gray-600 disabled:opacity-50">
                    <Mic size={20} />
                  </button>

                  <input
                    type="text"
                    placeholder="اكتب رسالتك هنا..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") sendMsg(); }}
                    className="flex-1 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#1B5E38]"
                    style={{ borderColor: "#E5E7EB" }}
                  />

                  <button onClick={() => sendMsg()} disabled={isUploading || (!newMessage.trim())} className="p-2.5 rounded-xl text-white transition-all disabled:opacity-50 hover:scale-105" style={{ backgroundColor: C.primary }}>
                    {isUploading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB: WAGES */}
        {activeTab === "wages" && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg mb-2" style={{ color: C.dark }}>سجل الأجور والمدفوعات</h3>
            {wages.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border bg-white" style={{ borderColor: "#E5E7EB" }}>
                <DollarSign size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium text-sm">لا توجد مستحقات أو أجور مسجلة لهذا الخياط حتى الآن.</p>
              </div>
            ) : (
              wages.map((w) => (
                <WageHistoryRow
                  key={w.id}
                  wage={w}
                  tailorName={selectedTailor?.full_name || ""}
                  onPay={() => setShowPayConfirm(w.id)}
                />
              ))
            )}
          </div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === "settings" && selectedTailor && (
          <div className="rounded-2xl border p-6 max-w-2xl bg-white" style={{ borderColor: "#E5E7EB" }}>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2" style={{ color: C.dark }}>
              <User size={22} style={{ color: C.primary }} /> إعدادات بيانات الخياط
            </h3>
            <form onSubmit={handleUpdateTailor} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">اسم الخياط الكامل</label>
                <input
                  type="text"
                  value={selectedTailor.full_name}
                  onChange={(e) => updateSelectedTailorField("full_name", e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#1B5E38]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="text"
                    value={selectedTailor.phone ?? ""}
                    onChange={(e) => updateSelectedTailorField("phone", e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#1B5E38]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">رمز PIN الخاص بالدخول</label>
                  <input
                    type="text"
                    value={selectedTailor.pin_code ?? ""}
                    onChange={(e) => updateSelectedTailorField("pin_code", e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#1B5E38]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">نسبة الأجر الأسبوعي (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={selectedTailor.wage_percentage}
                  onChange={(e) => updateSelectedTailorField("wage_percentage", Number(e.target.value))}
                  required
                  className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#1B5E38]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={selectedTailor.is_active}
                  onChange={(e) => updateSelectedTailorField("is_active", e.target.checked)}
                  className="w-4 h-4 text-[#1B5E38] rounded focus:ring-0 cursor-pointer"
                />
                <label htmlFor="is_active" className="text-sm font-bold text-gray-700 cursor-pointer">
                  حالة الحساب (نشط / مفعل)
                </label>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:shadow-lg hover:scale-105"
                  style={{ backgroundColor: C.primary }}
                >
                  <Save size={18} /> حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* MODAL: ADD TAILOR */}
      {showAddTailor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowAddTailor(false)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h3 className="font-bold text-lg mb-4 text-gray-800">إضافة خياط جديد</h3>
            <form onSubmit={handleCreateTailor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={newTailorData.full_name}
                  onChange={(e) => setNewTailorData({ ...newTailorData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#1B5E38]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={newTailorData.phone}
                  onChange={(e) => setNewTailorData({ ...newTailorData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#1B5E38]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">رمز PIN</label>
                  <input
                    type="text"
                    required
                    value={newTailorData.pin_code}
                    onChange={(e) => setNewTailorData({ ...newTailorData, pin_code: e.target.value })}
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#1B5E38]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">نسبة الأجر (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={newTailorData.wage_percentage}
                    onChange={(e) => setNewTailorData({ ...newTailorData, wage_percentage: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#1B5E38]"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddTailor(false)} className="px-4 py-2 rounded-xl text-gray-600 bg-gray-100 text-sm font-medium">إلغاء</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: C.primary }}>إضافة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CAMERA */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-black rounded-2xl overflow-hidden">
            <video ref={videoRef} className="w-full h-80 object-cover" autoPlay playsInline />
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6">
              <button onClick={closeCamera} className="p-3 rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/30">
                <X size={24} />
              </button>
              <button onClick={capturePhoto} className="p-4 rounded-full bg-white text-black shadow-lg hover:scale-105 transition-transform">
                <Camera size={28} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PAY CONFIRM */}
      {showPayConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={28} />
            </div>
            <h3 className="font-bold text-base text-gray-800">تأكيد دفع الأجر الأسبوعي</h3>
            <p className="text-xs text-gray-500">هل أنت تأكد من تسجيل هذا المبلغ كمدفوع للخياط؟ لا يمكن التراجع عن هذه العملية لاحقاً.</p>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={() => setShowPayConfirm(null)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold">إلغاء</button>
              <button onClick={() => showPayConfirm && handlePayWage(showPayConfirm)} className="px-5 py-2 rounded-xl text-white text-xs font-bold" style={{ backgroundColor: C.success }}>تأكيد الدفع</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}