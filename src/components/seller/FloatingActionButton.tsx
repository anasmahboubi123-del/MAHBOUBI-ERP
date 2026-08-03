// src/components/seller/FloatingActionButton.tsx
'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  label?: string;
}

export default function FloatingActionButton({ onClick, label = 'طلبية جديدة' }: FABProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-5 py-3.5 bg-[#4A6741] text-white rounded-full shadow-lg shadow-[#4A6741]/30 hover:shadow-xl hover:shadow-[#4A6741]/40 transition-shadow"
    >
      <Plus className="w-5 h-5" />
      <span className="font-semibold text-sm">{label}</span>
    </motion.button>
  );
}