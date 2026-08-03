// src/components/seller/AppBar.tsx
'use client';

import { useState } from 'react';
import { Menu, X, LogOut, Home, Package, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { getPublicImageUrl } from '@/lib/supabase-seller';

interface AppBarProps {
  logoUrl: string | null;
  storeName: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function AppBar({ logoUrl, storeName, onNavigate, onLogout }: AppBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Today's date in Arabic
  const today = new Date().toLocaleDateString('ar-MA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const menuItems = [
    { icon: Home, label: 'الرئيسية', page: 'home' },
    { icon: Package, label: 'المنتجات', page: 'products' },
    { icon: ImageIcon, label: 'الألبوم', page: 'album' },
  ];

  return (
    <>
      {/* Top AppBar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Store Name */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(true)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B5E3B] to-[#145030] flex items-center justify-center shadow-sm overflow-hidden">
                  {logoUrl ? (
                    <Image
                      src={getPublicImageUrl('site-assets', logoUrl)}
                      alt={storeName}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">م</span>
                  )}
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-bold text-sm text-gray-900 leading-tight">
                    Ameublement et Déco
                  </h1>
                  <p className="text-xs text-[#C9A84C] font-semibold leading-tight">
                    El Mahboubi
                  </p>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="flex-1 text-center hidden md:block">
              <p className="text-sm text-gray-500 font-medium">{today}</p>
            </div>

            {/* Right side — just logout for desktop */}
            <div className="flex items-center gap-2">
              <button
                onClick={onLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-72 bg-white z-50 shadow-2xl"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1B5E3B] to-[#145030] flex items-center justify-center overflow-hidden">
                      {logoUrl ? (
                        <Image
                          src={getPublicImageUrl('site-assets', logoUrl)}
                          alt={storeName}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">م</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">Ameublement et Déco</p>
                      <p className="text-xs text-[#C9A84C] font-semibold">El Mahboubi</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Date in mobile menu */}
                <div className="px-3 py-2 bg-gray-50 rounded-xl mb-4">
                  <p className="text-xs text-gray-500 text-center">{today}</p>
                </div>

                {/* Menu Items */}
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.page}
                      onClick={() => {
                        onNavigate(item.page);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-right"
                    >
                      <item.icon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </button>
                  ))}
                </nav>

                {/* Logout */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      onLogout();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-right"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium text-sm">تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}