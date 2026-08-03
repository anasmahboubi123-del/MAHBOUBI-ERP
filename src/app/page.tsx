'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { getSiteAssetUrl } from '@/lib/site-assets';

function img(path: string): string {
  return getSiteAssetUrl(path);
}

const ROLES = [
  { 
    id: 'admin',  
    title: 'المدير',  
    href: '/admin',
    image: 'site-assets/roles/admin.PNG'
  },
  { 
    id: 'seller',
    title: 'البائع',  
    href: '/seller',
    image: 'site-assets/roles/seler.PNG'
  },
  { 
    id: 'tailor', 
    title: 'الخياط',  
    href: '/tailor',
    image: 'site-assets/roles/tailor.PNG'
  },
];

const BG_IMAGE = 'site-assets/backgrounds/home-bg.PNG';
const LOGO_IMAGE = 'site-assets/logo.jpg';

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center overflow-hidden" dir="rtl" style={{ fontFamily: 'Cairo, sans-serif' }}>
      
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img(BG_IMAGE)} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(245,236,215,0.78)' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full flex-1 px-4 pt-8 pb-0">
        
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex flex-col items-center mb-2">
          <div className="w-20 h-20 relative mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img(LOGO_IMAGE)} alt="El Mahboubi" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-[#1B5E3B] font-bold text-sm tracking-[0.2em] text-center leading-tight">
            AMEUBLEMENT<br />ET DÉCO<br />EL MAHBOUBI
          </h1>
          <p className="text-[#C9A84C] text-[10px] mt-1 tracking-wide">Un intérieur qui vous ressemble</p>
          <div className="flex items-center gap-1 mt-2">
            <div className="w-8 h-[1px] bg-[#C9A84C]" />
            <div className="w-1.5 h-1.5 bg-[#C9A84C] rotate-45" />
            <div className="w-8 h-[1px] bg-[#C9A84C]" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="flex items-center gap-3 my-4">
          <div className="w-12 h-[1px] bg-[#C9A84C]" />
          <span className="text-[#1B5E3B] text-sm font-semibold tracking-wide">اختر دورك للمتابعة</span>
          <div className="w-12 h-[1px] bg-[#C9A84C]" />
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-4xl px-4 mb-8">
          {ROLES.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * index, duration: 0.6 }}
              className={role.id === 'seller' ? 'md:order-2' : role.id === 'admin' ? 'md:order-1' : 'md:order-3'}
            >
              <Link href={role.href} className="group relative flex flex-col items-center w-full max-w-[220px] mx-auto">
                <div className="relative w-full bg-gradient-to-b from-[#C9A84C] to-[#b8943f] p-[3px] transition-transform duration-300 group-hover:scale-[1.03]" style={{ borderRadius: '50% 50% 10px 10px / 30% 30% 10px 10px', boxShadow: '0 8px 32px rgba(33,71,52,0.25)' }}>
                  <div className="relative w-full overflow-hidden bg-[#FFFDF8]" style={{ borderRadius: '50% 50% 8px 8px / 30% 30% 8px 8px', aspectRatio: '0.85' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img(role.image)} alt={role.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#FFFDF8] to-transparent" />
                  </div>
                </div>
                <h2 className="mt-3 text-xl font-bold text-[#1B5E3B] text-center">{role.title}</h2>
                <div className="mt-2 px-8 py-2 rounded-full text-white font-bold text-sm" style={{ backgroundColor: '#1B5E3B' }}>دخول</div>
                <div className="mt-3 w-10 h-10 rounded-full border-2 border-[#C9A84C] flex items-center justify-center text-[#C9A84C]">
                  {role.id === 'admin' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                  {role.id === 'seller' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>}
                  {role.id === 'tailor' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3" /><path d="M8 12l6 6" /><path d="M20 4l-6 6" /><path d="M14 4l6 6" /></svg>}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="flex-1" />
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }} className="relative z-10 w-full" style={{ backgroundColor: '#1B5E3B' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between text-white/80 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg><span>العربية</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/60">ERP v2.0</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span>متصل</span></span>
          </div>
          <div className="flex items-center gap-2 text-white/60"><span>آخر دخول</span><span className="text-white/40">اليوم 10:25</span></div>
        </div>
      </motion.div>
    </main>
  );
}