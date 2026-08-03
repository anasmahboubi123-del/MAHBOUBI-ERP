'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
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
export default function ChatSystem({
  orderId,
  senderRole,
}: {
  orderId: string;
  senderRole: 'admin' | 'tailor';
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLInputElement>(null);

  // ✅ CORRECTION 1: Gestion d'erreur + loading state
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('messages')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at');

        if (!active) return;

        if (error) {
          console.error('Messages fetch error:', error);
          toast.error('فشل تحميل الرسائل');
        } else {
          setMessages((data as Msg[]) ?? []);
        }
      } catch (err) {
        if (!active) return;
        console.error(err);
        toast.error('خطأ في تحميل الرسائل');
      } finally {
        if (active) setLoading(false);
      }
    })();

    // ✅ CORRECTION 2: Gestion d'erreur de subscription
    const ch = (supabase as any)
      .channel(`msgs-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${orderId}`,
        },
        (p: any) => {
          setMessages((m) =>
            m.some((x) => x.id === (p.new as Msg).id)
              ? m
              : [...m, p.new as Msg]
          );
        }
      )
      .subscribe((status: string, err: any) => {
        if (err) {
          console.error('Realtime subscription error:', err);
          toast.error('فقد الاتصال المباشر بالرسائل');
        }
      });

    return () => {
      active = false;
      (supabase as any).removeChannel(ch);
    };
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ CORRECTION 3: send() avec gestion d'erreur complète + état de chargement
  const send = useCallback(
    async (payload: Partial<Msg>) => {
      if (sending) return; // Empêche le double-envoi
      setSending(true);

      try {
        const { data, error } = await (supabase as any)
          .from('messages')
          .insert({
            order_id: orderId,
            sender_role: senderRole,
            ...payload,
          })
          .select()
          .single();

        if (error) {
          toast.error('فشل الإرسال');
          console.error('Send error:', error);
          return;
        }

        if (!data) {
          toast.error('فشل الإرسال - لا يوجد رد من السيرفر');
          return;
        }

        setMessages((m) =>
          m.some((x) => x.id === data.id) ? m : [...m, data as Msg]
        );
      } catch (err) {
        console.error('Send exception:', err);
        toast.error('فشل الإرسال - خطأ غير متوقع');
      } finally {
        setSending(false);
      }
    },
    [orderId, senderRole, sending]
  );

  const sendText = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    await send({ body: trimmed });
    setText('');
    textareaRef.current?.focus();
  }, [text, sending, send]);

  // ✅ CORRECTION 4: Gestion IME (composition) pour l'arabe
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        e.preventDefault();
        sendText();
      }
    },
    [sendText]
  );

  // ✅ CORRECTION 5: Cleanup MediaRecorder + gestion d'erreur améliorée
  const toggleRecord = useCallback(async () => {
    if (rec) {
      rec.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const r = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      r.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRec(null);

        if (chunks.length === 0) {
          toast.error('التسجيل فارغ');
          return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
        const url = await uploadToBucket(
          'orders',
          `chat/${orderId}/${Date.now()}.${ext}`,
          blob
        );

        if (url) {
          await send({ audio_url: url });
        } else {
          toast.error('فشل رفع التسجيل');
        }
      };

      r.onerror = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRec(null);
        toast.error('خطأ في التسجيل');
      };

      r.start();
      setRec(r);
    } catch (err) {
      console.error('Microphone error:', err);
      toast.error('تعذر الوصول للميكروفون');
    }
  }, [rec, orderId, send]);

  // ✅ CORRECTION 6: Cleanup si le composant se démonte pendant l'enregistrement
  useEffect(() => {
    return () => {
      if (rec && rec.state !== 'inactive') {
        rec.stop();
      }
    };
  }, [rec]);

  const otherLabel = senderRole === 'admin' ? 'الخياط' : 'المدير';

  return (
    <div className="flex h-96 flex-col rounded-2xl border bg-white">
      <div className="border-b p-3 font-bold">
        💬 المراسلة مع {otherLabel}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {loading && (
          <p className="text-center text-sm text-gray-400">جارٍ تحميل الرسائل...</p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-gray-400">لا توجد رسائل بعد</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.sender_role === senderRole ? 'justify-start' : 'justify-end'
            }`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                m.sender_role === senderRole
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100'
              }`}
            >
              {m.body && <p className="break-words">{m.body}</p>}
              {m.attachment_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.attachment_url}
                  alt="مرفق"
                  className="mt-1 max-h-48 rounded-lg"
                  loading="lazy"
                />
              )}
              {m.audio_url && (
                <audio controls src={m.audio_url} className="mt-1 w-48" />
              )}
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
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اكتب رسالة..."
          disabled={sending}
          className="flex-1 rounded-xl border px-3 py-2 focus:border-brand-600 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={sendText}
          disabled={sending || !text.trim()}
          className="rounded-xl bg-brand-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {sending ? '...' : 'إرسال'}
        </button>
        <button
          onClick={toggleRecord}
          disabled={sending}
          className={`rounded-xl px-3 py-2 disabled:opacity-50 ${
            rec
              ? 'animate-pulse bg-red-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
          title="رسالة صوتية"
        >
          {rec ? '⏹️' : '🎤'}
        </button>
        <ImageUploader
          bucket="orders"
          folder={`chat/${orderId}`}
          onUploaded={(url) => send({ attachment_url: url })}
          label="📎"
        />
      </div>
    </div>
  );
}