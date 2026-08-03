'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

interface ManagerPinGateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pin?: string;
  title?: string;
}

export default function ManagerPinGate({
  open,
  onClose,
  onSuccess,
  pin = '9999',
  title = 'أدخل كود المدير',
}: ManagerPinGateProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  if (!open) return null;

  const submit = () => {
    if (value === pin) {
      setValue('');
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-center gap-2 text-[#0D1F17]">
          <Lock className="h-5 w-5 text-[#C9A84C]" />
          <h3 className="font-bold">{title}</h3>
        </div>
        <input
          type="password"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className={`w-full rounded-xl border-2 px-4 py-2.5 text-center text-lg tracking-widest focus:outline-none ${
            error ? 'border-red-400' : 'border-gray-200 focus:border-[#1B5E3B]'
          }`}
          placeholder="••••"
          autoFocus
        />
        {error && <p className="mt-1.5 text-center text-xs text-red-500">كود خاطئ، حاول مرة أخرى</p>}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            onClick={submit}
            className="flex-1 rounded-xl bg-[#1B5E3B] py-2 text-sm font-bold text-white hover:bg-[#164a30]"
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}