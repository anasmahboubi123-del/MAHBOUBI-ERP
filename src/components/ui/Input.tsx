'use client';
import { InputHTMLAttributes } from 'react';

export default function Input({
  label,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-semibold text-gray-600">{label}</span>}
      <input
        className={`w-full rounded-xl border border-gray-300 px-4 py-3 text-lg focus:border-brand-600 focus:outline-none ${className}`}
        {...props}
      />
    </label>
  );
}
