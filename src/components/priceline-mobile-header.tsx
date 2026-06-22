'use client';

import Link from 'next/link';
import { Menu, X, Plane, Heart, PhoneCall, Home } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export default function PricelineMobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="absolute top-0 left-0 right-0 h-14 bg-white flex items-center justify-between px-4 z-50 border-b border-slate-200">
          <div className="flex items-center h-full gap-3">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors">
                {isMenuOpen ? <X className="w-6 h-6 text-[#0055D4]" /> : <Menu className="w-6 h-6 text-[#0055D4]" />}
              </button>
              <div className="h-6 w-px bg-slate-300" />
              <Link href="/during-trip/homescreen">
                <Image src="/trvlr-logo.png" alt="trvlr logo" width={80} height={30} className="h-6 w-auto" />
              </Link>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-white rounded-full px-2 py-1 border border-slate-200 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-[#0055D4] text-[#ffff00] flex items-center justify-center text-[10px] font-bold font-mono">vip</div>
                  <span className="text-xs font-bold text-slate-700 tracking-wide">GOLD</span>
              </div>
              <span className="text-sm font-semibold text-[#0055D4]">Andy</span>
          </div>
      </div>

      {/* Dropdown Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed top-14 left-0 right-0 bottom-0 bg-black/30 z-40 transition-opacity" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute top-0 left-0 right-0 bg-white shadow-xl animate-slide-down border-b border-slate-200 py-2 z-50" onClick={(e) => e.stopPropagation()}>
            <ul className="divide-y divide-slate-100">
              <li>
                <Link href="/during-trip/homescreen" className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <Home className="w-5 h-5 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-800">Home Screen</span>
                </Link>
              </li>
              <li>
                <Link href="/during-trip/saved-trips" className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <Heart className="w-5 h-5 text-[#E91E63]" />
                  <span className="text-sm font-semibold text-slate-800">Saved Trips</span>
                </Link>
              </li>
              <li>
                <Link href="/during-trip/itinerary" className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <Plane className="w-5 h-5 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-800">Itinerary</span>
                </Link>
              </li>
              <li>
                <Link href="/during-trip/mobile-call" className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <PhoneCall className="w-5 h-5 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-800">AI Assist</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
