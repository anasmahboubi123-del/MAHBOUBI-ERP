'use client';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase, uploadToBucket } from '@/lib/supabase';
import ImageUploader from '@/components/ui/ImageUploader';

interface Msg {
  id: string;
  sender_role: 'admin' | 'tailor';
  body: string | null;
  attachment_url: string | null;
  audio_url: string | null;
  created_at: string;
}

/** نظام مراسلة داخلي بين المدير والخياط (نص + صور + رسائل صوتية) */
export default function ChatSystem({ orderId, senderRole }: { orderId: string; senderRole: 'admin' | 'tailor' }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at');
      if (active) setMessages((data as Msg[]) ?? []);
    })();

    const ch = supabase
      .channel(`msgs-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${orderId}` },
        (p) => setMessages((m) => (m.some((x) => x.id === (p.new as Msg).id) ? m : [...m, p.new as Msg]))
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(payload: Partial<Msg>) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ order_id: orderId, sender_role: senderRole, ...payload })
      .select()
      .single();
    if (error) return toast.error('فشل الإرسال');
    setMessages((m) => (m.some((x) => x.id === data.id) ? m : [...m, data as Msg]));
  }

  async function sendText() {
    if (!text.trim()) return;
    await send({ body: text.trim() });
    setText('');
  }

  /** تسجيل رسالة صوتية */
  async function toggleRecord() {
    if (rec) {
      rec.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRec(null);
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = await uploadToBucket('orders', `chat/${orderId}/${Date.now()}.webm`, blob);
        if (url) await send({ audio_url: url });
        else toast.error('فشل رفع التسجيل');
      };
      r.start();
      setRec(r);
    } catch {
      toast.error('تعذر الوصول للميكروفون');
    }
  }

  return (
    <div className="flex h-96 flex-col rounded-2xl border bg-white">
      <div className="border-b p-3 font-bold">💬 المراسلة مع {senderRole === 'admin' ? 'الخياط' : 'المدير'}</div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && <p className="text-center text-sm text-gray-400">لا توجد رسائل بعد</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_role === senderRole ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${m.sender_role === senderRole ? 'bg-brand-600 text-white' : 'bg-gray-100'}`}
            >
              {m.body && <p>{m.body}</p>}
              {m.attachment_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.attachment_url} alt="" className="mt-1 max-h-48 rounded-lg" />
              )}
              {m.audio_url && <audio controls src={m.audio_url} className="mt-1 w-48" />}
              <div className="mt-1 text-[10px] opacity-60" dir="ltr">
                {new Date(m.created_at).toLocaleString('fr-MA')}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendText()}
          placeholder="اكتب رسالة..."
          className="flex-1 rounded-xl border px-3 py-2 focus:border-brand-600 focus:outline-none"
        />
        <button onClick={sendText} className="rounded-xl bg-brand-600 px-4 py-2 text-white">إرسال</button>
        <button
          onClick={toggleRecord}
          className={`rounded-xl px-3 py-2 ${rec ? 'animate-pulse bg-red-600 text-white' : 'bg-gray-100'}`}
          title="رسالة صوتية"
        >
          {rec ? '⏹️' : '🎤'}
        </button>
        <ImageUploader bucket="orders" folder={`chat/${orderId}`} onUploaded={(url) => send({ attachment_url: url })} label="📎" />
      </div>
    </div>
  );
}
