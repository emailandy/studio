'use client';

import { Hotel, Plane, Briefcase, Car, Ship, Search, Calendar, User, Check, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import PricelineMobileHeader from '@/components/priceline-mobile-header';
import Image from 'next/image';

export default function MobileCallPage() {
  const [activeTab, setActiveTab] = useState('Hotels');
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);


  const tabs = [
    { name: 'Hotels', icon: Hotel },
    { name: 'Flights', icon: Plane },
    { name: 'Bundle & Save', icon: Briefcase },
    { name: 'Cars', icon: Car },
    { name: 'Cruises', icon: Ship },
  ];

  return (
    <div className="relative h-screen w-full bg-[#f4f7f9] font-sans overflow-y-auto">
      
      <PricelineMobileHeader />

      {/* Main Content (Shifted down for fixed header) */}
      <div className="pt-10 pb-16 px-3">
        
        {/* 2. Product Icon Carousel */}
        <div className="flex overflow-x-auto py-3 gap-3 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className="flex flex-col items-center flex-shrink-0"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-sm transition-all ${
                activeTab === tab.name 
                  ? "bg-[#0055D4] text-white border-[#0055D4]" 
                  : "bg-white text-slate-600 border-slate-200"
              }`}>
                <tab.icon className="w-5 h-5" />
              </div>
              <span className="mt-1 text-xs font-semibold text-slate-700 whitespace-nowrap">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* 3. Title */}
        <h2 className="text-xl font-bold text-[#001D6C] mt-2 mb-3">Save big on your next hotel</h2>

        {/* 4. Form Fields */}
        <div className="space-y-2">
          {/* Location */}
          <div className="relative bg-white rounded-xl p-2.5 shadow-md border border-slate-100 flex items-center gap-3">
            <Search className="w-5 h-5 text-[#0055D4]" />
            <input type="text" placeholder="Where to?" className="w-full bg-transparent outline-none text-slate-800 text-sm" />
          </div>

          {/* Dates */}
          <div className="relative bg-white rounded-xl p-2.5 shadow-md border border-slate-100 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#0055D4]" />
            <div>
              <span className="text-[10px] text-slate-500 block">Check-in - Check-out</span>
              <span className="text-sm font-semibold text-slate-800">06/11/2024 - 06/12/2024</span>
            </div>
          </div>

          {/* Guests */}
          <div className="relative bg-white rounded-xl p-2.5 shadow-md border border-slate-100 flex items-center gap-3">
            <User className="w-5 h-5 text-[#0055D4]" />
            <span className="text-sm font-semibold text-slate-800">2 Adults, 1 Room</span>
          </div>
        </div>

        {/* 5. Bundle & Save Green Promo */}
        <div className="mt-4 bg-[#e4f5ca] rounded-xl p-4 flex flex-col gap-3 shadow-md border border-[#d2edaa]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#4a7212] text-white rounded flex items-center justify-center text-xs font-bold">$</div>
            <span className="text-sm font-bold text-[#203604]">Bundle & Save</span>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
              Add a car
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
              Add a flight
            </label>
          </div>
        </div>

        {/* 6. Primary Action Button */}
        <button className="w-full mt-4 bg-[#0055D4] text-white py-3.5 rounded-xl font-bold tracking-wide shadow-lg hover:bg-[#0044b3] transition-colors">
          Find Your Hotel
        </button>

      </div>



        {/* Footer AI Assist Logo */}
        <div className="flex flex-col items-center justify-center mt-8 mb-6 pb-4">
          <div className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transform transition-transform active:scale-95 overflow-hidden cursor-pointer bg-white border border-slate-200" onClick={() => setIsPlayingVideo(true)}>
            <Image src="/trvlr-logo.png" alt="AI Assist" width={56} height={56} className="w-full h-auto object-contain p-2" />
          </div>
        </div>

      {/* Video Overlay */}
      {isPlayingVideo && (
        <div className="fixed top-14 left-0 right-0 bottom-0 bg-black/80 z-40 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-3 flex justify-between items-center border-b">
              <span className="font-semibold text-[#001D6C] text-sm">AI Assist Demo</span>
              <button 
                onClick={() => setIsPlayingVideo(false)}
                className="p-1 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="relative bg-black" style={{ minHeight: '200px' }}>
              <video controls autoPlay className="w-full h-auto">
                <source src="/videos/priceline_gecx_demo_mobile.webm" type="video/webm" />
                <source src="/videos/video_walk.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
