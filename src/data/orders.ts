// ============================================
// ملف البيانات — الطلبيات المركبة (Composite Orders)
// ============================================

export type OrderStatus = "new" | "review" | "sent" | "in-progress" | "partial" | "ready" | "delivered" | "late";
export type PartType = "salon" | "bounge" | "tapis" | "bois" | "rembourrage";
export type PartStatus = "pending" | "ordered" | "waiting" | "received" | "in-progress" | "done" | "na";

export type OrderPart = {
  id: string;
  type: PartType;
  label: string;
  amount: number;
  status: PartStatus;
  assignedTo?: string; // اسم الخياط / المورد / مصطفى
  assignedId?: string; // noureddine | abdelrahim | mustafa | supplier
  whatsappNumber?: string; // للموردين الخارجيين
  whatsappMessage?: string; // الرسالة التلقائية
  notes?: string;
  images?: string[];
  dueDate?: string;
};

export type OrderMessage = {
  id: string;
  from: "admin" | "tailor";
  senderName: string;
  text: string;
  time: string;
  type?: "text" | "image";
};

export type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  deposit: number;
  depositPercent: number;
  status: OrderStatus;
  deliveryDate: string;
  createdAt: string;
  createdBy: string; // اسم البائع
  parts: OrderPart[];
  adminNotes: string;
  tailorNotes: string;
  images: string[];
  messages: OrderMessage[];
  timeline: { date: string; event: string; by: string }[];
};

// الخياطون
export const tailors = [
  { id: "noureddine", name: "نور الدين", pin: "5678", image: "/images/roles/tailor.jpg" },
  { id: "abdelrahim", name: "عبد الرحيم", pin: "5679", image: "/images/roles/admin.jpg" },
];

// الموردون (يُدخلهم المدير لاحقاً في الإعدادات)
export const suppliers = [
  { id: "bounge-cie", name: "شركة البونج", phone: "+212600000001", category: "bounge" },
  { id: "tapis-atelier", name: "معمل الزرابي", phone: "+212600000002", category: "tapis" },
  { id: "bois-menuisier", name: "نجار الخشب", phone: "+212600000003", category: "bois" },
];

// مصطفى (عامل اللواط)
export const rembourrageWorker = { id: "mustafa", name: "مصطفى", role: "عامل ملء الوسائد" };

// أيقونات الأجزاء
export const partIcons: Record<PartType, string> = {
  salon: "🛋️",
  bounge: "🧽",
  tapis: "🧶",
  bois: "🪵",
  rembourrage: "🪶",
};

// أسماء الأجزاء
export const partLabels: Record<PartType, string> = {
  salon: "صالون مغربي",
  bounge: "بونج",
  tapis: "زربية",
  bois: "خشب",
  rembourrage: "ملء وسائد (لواط)",
};

// ============================================
// طلبات تجريبية
// ============================================
export const orders: Order[] = [
  {
    id: "ord-007",
    customerName: "يوسف التطواني",
    customerPhone: "0661-223-344",
    totalAmount: 7200,
    deposit: 2160,
    depositPercent: 30,
    status: "new",
    deliveryDate: "2026-07-28",
    createdAt: "2026-07-23T14:30:00",
    createdBy: "أنس",
    parts: [
      { id: "p1", type: "salon", label: "صالون مغربي — ثوب أخضر داكن", amount: 5200, status: "pending" },
      { id: "p2", type: "bounge", label: "بونج — 3 وحدات", amount: 800, status: "pending", whatsappNumber: "+212600000001", whatsappMessage: "طلب بونج: 3 وحدات لصالون يوسف التطواني، التسليم 28/07" },
      { id: "p3", type: "tapis", label: "زربية صالون — 250×200سم", amount: 600, status: "pending", whatsappNumber: "+212600000002", whatsappMessage: "طلب زربية: 250×200سم لصالون يوسف التطواني" },
      { id: "p4", type: "bois", label: "خشب صندوق خشبي فاصل", amount: 400, status: "pending", whatsappNumber: "+212600000003", whatsappMessage: "طلب خشب: صندوق فاصل لصالون يوسف التطواني" },
      { id: "p5", type: "rembourrage", label: "ملء وسائد — 5 مخدات (لواط)", amount: 200, status: "pending", assignedId: "mustafa", assignedTo: "مصطفى" },
    ],
    adminNotes: "",
    tailorNotes: "",
    images: [],
    messages: [],
    timeline: [
      { date: "2026-07-23 14:30", event: "الطلب أنشئ (البائع: أنس)", by: "أنس" },
    ],
  },
  {
    id: "ord-003",
    customerName: "محمد الوزاني",
    customerPhone: "0669-988-776",
    totalAmount: 1800,
    deposit: 540,
    depositPercent: 30,
    status: "sent",
    deliveryDate: "2026-08-01",
    createdAt: "2026-07-20T10:00:00",
    createdBy: "أنس",
    parts: [
      { id: "p1", type: "tapis", label: "زربية صالون — 250×200سم", amount: 1800, status: "ordered", whatsappNumber: "+212600000002", whatsappMessage: "طلب زربية: 250×200سم لمحمد الوزاني" },
    ],
    adminNotes: "لون بيج مع زخرفة خضراء",
    tailorNotes: "",
    images: [],
    messages: [
      { id: "m1", from: "admin", senderName: "المدير", text: "تم إرسال الطلب لصانع الزرابي", time: "10:05" },
    ],
    timeline: [
      { date: "2026-07-20 10:00", event: "الطلب أنشئ", by: "أنس" },
      { date: "2026-07-20 10:05", event: "إرسال طلب الزرابي عبر واتساب", by: "المدير" },
    ],
  },
  {
    id: "ord-001",
    customerName: "أحمد بنعلي",
    customerPhone: "0661-122-334",
    totalAmount: 3200,
    deposit: 960,
    depositPercent: 30,
    status: "ready",
    deliveryDate: "2026-07-23",
    createdAt: "2026-07-15T09:00:00",
    createdBy: "أنس",
    parts: [
      { id: "p1", type: "salon", label: "صالون مغربي — ثوب أخضر", amount: 3200, status: "done", assignedId: "noureddine", assignedTo: "نور الدين" },
    ],
    adminNotes: "استخدم الثوب الأخضر الداكن للسداري الأول فقط",
    tailorNotes: "ركز على جودة الزيب",
    images: ["/images/products/salon.jpg"],
    messages: [
      { id: "m1", from: "tailor", senderName: "نور الدين", text: "أنهيت العمل", time: "14:00" },
      { id: "m2", from: "admin", senderName: "المدير", text: "ممتاز، سأتصل بالزبون", time: "14:30" },
    ],
    timeline: [
      { date: "2026-07-15 09:00", event: "الطلب أنشئ", by: "أنس" },
      { date: "2026-07-15 10:00", event: "إرسال للخياط نور الدين", by: "المدير" },
      { date: "2026-07-22 14:00", event: "الخياط أنهى العمل", by: "نور الدين" },
    ],
  },
  {
    id: "ord-002",
    customerName: "فاطمة الزهراء",
    customerPhone: "0665-566-778",
    totalAmount: 4100,
    deposit: 1230,
    depositPercent: 30,
    status: "in-progress",
    deliveryDate: "2026-07-25",
    createdAt: "2026-07-18T11:00:00",
    createdBy: "أنس",
    parts: [
      { id: "p1", type: "salon", label: "خامية عصرية — كريمي مطرز", amount: 4100, status: "in-progress", assignedId: "abdelrahim", assignedTo: "عبد الرحيم" },
    ],
    adminNotes: "الزبونة مستعجلة",
    tailorNotes: "بدأت العمل اليوم",
    images: [],
    messages: [
      { id: "m1", from: "admin", senderName: "المدير", text: "الزبونة مستعجلة", time: "09:00" },
      { id: "m2", from: "tailor", senderName: "عبد الرحيم", text: "بدأت العمل اليوم", time: "09:15" },
    ],
    timeline: [
      { date: "2026-07-18 11:00", event: "الطلب أنشئ", by: "أنس" },
      { date: "2026-07-18 12:00", event: "إرسال للخياط عبد الرحيم", by: "المدير" },
      { date: "2026-07-23 09:15", event: "بدأ العمل", by: "عبد الرحيم" },
    ],
  },
  {
    id: "ord-006",
    customerName: "سمية الفاسية",
    customerPhone: "0663-344-556",
    totalAmount: 1500,
    deposit: 450,
    depositPercent: 30,
    status: "late",
    deliveryDate: "2026-07-21",
    createdAt: "2026-07-10T08:00:00",
    createdBy: "أنس",
    parts: [
      { id: "p1", type: "salon", label: "طابورية — ثوب كريمي", amount: 1500, status: "in-progress", assignedId: "noureddine", assignedTo: "نور الدين" },
    ],
    adminNotes: "",
    tailorNotes: "",
    images: [],
    messages: [],
    timeline: [
      { date: "2026-07-10 08:00", event: "الطلب أنشئ", by: "أنس" },
      { date: "2026-07-10 09:00", event: "إرسال للخياط نور الدين", by: "المدير" },
    ],
  },
];

// دوال مساعدة
export function getStatusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    new: "🟡 جديد",
    review: "🟠 قيد المراجعة",
    sent: "🔵 مرسل للخياط",
    "in-progress": "🟣 قيد التنفيذ",
    partial: "⚪ جزئي",
    ready: "🟢 جاهز",
    delivered: "⚫ مُسلّم",
    late: "🔴 متأخر",
  };
  return map[status] || status;
}

export function getPartStatusLabel(status: PartStatus): string {
  const map: Record<PartStatus, string> = {
    pending: "⏳ بانتظار الإرسال",
    ordered: "📤 تم الطلب",
    waiting: "⏱️ بانتظار الرد",
    received: "📦 تم الاستلام",
    "in-progress": "🪡 قيد التنفيذ",
    done: "✅ تم",
    na: "—",
  };
  return map[status] || status;
}

export function getDaysLeft(deliveryDate: string): number {
  const diff = new Date(deliveryDate).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getPartsSummary(parts: OrderPart[]): string {
  const counts: Record<string, number> = {};
  parts.forEach((p) => { counts[p.type] = (counts[p.type] || 0) + 1; });
  return Object.entries(counts).map(([type, count]) => `${partIcons[type as PartType]}×${count}`).join(" ");
}