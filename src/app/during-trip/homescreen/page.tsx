'use client';

import { 
  Search, 
  Mic, 
  Camera, 
  Phone, 
  MessageSquare, 
  Globe, 
  Wifi, 
  Battery, 
  Signal, 
  CloudSun, 
  Sparkles, 
  Video, 
  MicIcon, 
  Music, 
  Image as ImageIcon, 
  MapPin, 
  Mail, 
  Play, 
  Car, 
  Clapperboard,
  BadgeInfo
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomescreenPage() {
  const [showNotification, setShowNotification] = useState(false);
  return (
    <div className="relative h-screen w-full bg-cover bg-center font-sans overflow-hidden select-none"
         style={{ backgroundImage: "url('/images/homescreen_bg.png')" }}>
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* 1. Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-6 z-50 text-white text-xs font-medium tracking-wide">
        <span>10:58</span>
        <div className="flex items-center gap-2">
          <Signal size={14} />
          <Wifi size={14} />
          <Battery size={14} />
        </div>
      </div>

      {/* 1b. Heads-up Notification (Conditional) */}
      {showNotification && (
        <div className="absolute top-12 left-4 right-4 z-50 transform transition-all duration-300 ease-out">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 flex flex-col gap-2 cursor-pointer hover:bg-white transition-colors"
               onClick={() => setShowNotification(false)}>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 overflow-hidden flex-shrink-0">
                <Image src="/trvlr-logo.png" alt="trvlr logo" width={40} height={40} className="w-full h-auto object-contain p-1" />
              </div>
              <span className="text-xs font-semibold text-gray-800">AI Assist</span>
              <span className="text-xs text-gray-400 ml-auto">Just now</span>
            </div>
            <p className="text-sm font-medium text-gray-900 leading-tight">
              Flight Landed Before Hotel Checkin Time, Check Hotel for Early Check-in?
            </p>
          </div>
        </div>
      )}

      {/* Main Content (Shifted down for status bar) */}
      <div className="h-full pt-10 pb-6 px-4 flex flex-col justify-between tracking-normal">

        <div>
          {/* 2. At a Glance Text */}
          <div className="mt-4 px-2 text-white">
            <h1 className="text-lg font-semibold flex items-center gap-1.5">
              21° in Riverdale, Toronto tomorrow
            </h1>
            <span className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
              <CloudSun size={14} /> 2° warmer than today
            </span>
          </div>

          {/* 3. Main Glass Widgets Group */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            
            {/* Weather Widget */}
            <div className="bg-[#2D3E24]/80 backdrop-blur-xl rounded-[28px] p-4 flex flex-col justify-between h-[140px] border border-white/10 shadow-lg">
              <div className="flex justify-between items-start">
                <CloudSun size={40} className="text-white fill-white/20" />
                <span className="text-white/80 text-xs font-medium">Toronto</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-light text-white">18°</span>
                <span className="text-sm text-white/60">Cloudy</span>
              </div>
            </div>

            {/* Gemini / Assistant Hub */}
            <div className="bg-[#3A331E]/80 backdrop-blur-xl rounded-[28px] p-4 flex flex-col justify-between h-[140px] border border-white/10 shadow-lg">
              <div className="flex justify-between items-center">
                <Sparkles size={24} className="text-amber-300" />
                <span className="text-white/80 text-xs font-medium">As...</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-auto">
                <div className="bg-white/15 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/25 transition-colors">
                  <Video size={18} className="text-white" />
                  <span className="text-[10px] font-semibold text-white">Video</span>
                </div>
                <div className="bg-white/15 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/25 transition-colors">
                  <MicIcon size={18} className="text-white" />
                  <span className="text-[10px] font-semibold text-white">Live</span>
                </div>
              </div>
            </div>

          </div>

          {/* 4. App Grid (3 rows x 5 cols) */}
          <div className="grid grid-cols-5 gap-y-6 gap-x-3 mt-8 px-1">
            
            {/* Row 1 */}
            <AppIcon icon={Sparkles} label="Gemini" bgColor="bg-gradient-to-tr from-blue-600 to-cyan-400" />
            <AppIcon icon={BadgeInfo} label="theScore" bgColor="bg-[#051C3F]" iconColor="text-white" />
            <AppIcon icon={Globe} label="Feem" bgColor="bg-[#0D47A1]" />
            <AppIcon icon={ImageIcon} label="Lightroom" bgColor="bg-[#001D34]" iconColor="text-cyan-400" />
            <AppIcon icon={ImageIcon} label="Photos" bgColor="bg-white" iconColor="text-orange-500" />

            {/* Row 2 */}
            <AppIcon icon={Car} label="Lyft" bgColor="bg-[#FF00BF]" />
            <AppIcon icon={ImageIcon} label="Instagram" bgColor="bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500" />
            <AppIcon icon={Play} label="YouTube" bgColor="bg-white" iconColor="text-red-600" />
            <AppIcon icon={MapPin} label="Maps" bgColor="bg-white" iconColor="text-green-600" />
            <AppIcon icon={Music} label="Spotify" bgColor="bg-[#1DB954]" iconColor="text-black" />

            {/* Row 3 */}
            <ClothedAppIcon icon={Phone} label="Travel" bgColor="bg-[#0055D4]" iconColor="text-white" href="/during-trip/itinerary" />
            <AppIcon icon={MessageSquare} label="WhatsApp" bgColor="bg-[#25D366]" />
            <AppIcon icon={Play} label="Play Store" bgColor="bg-white" iconColor="text-blue-600" />
            <AppIcon icon={Mail} label="Gmail" bgColor="bg-white" iconColor="text-red-500" />
            <Link href="/during-trip/mobile-call" className="flex flex-col items-center gap-1.5 cursor-pointer">
              <div className="w-14 h-14 rounded-[1.75rem] flex items-center justify-center shadow-lg transform transition-transform active:scale-95 bg-white border border-slate-200 overflow-hidden">
                <Image src="/trvlr-logo.png" alt="trvlr logo" width={56} height={56} className="w-full h-auto object-contain p-2" />
              </div>
              <span className="text-[11px] text-white font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis w-14 text-center">
                trvlr
              </span>
            </Link>

          </div>
        </div>

        {/* Bottom Section (Hotseat & Search) */}
        <div className="w-full flex flex-col gap-6">

          {/* 5. Hotseat Dock (5 curated apps, translucent capsule) */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-[36px] py-4 px-3 grid grid-cols-5 gap-3 border border-white/10 shadow-2xl">
            <AppIconNoLabel icon={Phone} bgColor="bg-[#34A853]" />
            <AppIconNoLabel icon={MessageSquare} bgColor="bg-[#4285F4]" />
            <AppIconNoLabel icon={Globe} bgColor="bg-[#FBBC05]" onClick={() => setShowNotification(true)} />
            <AppIconNoLabel icon={Camera} bgColor="bg-[#EA4335]" />
            <AppIconNoLabel icon={Sparkles} bgColor="bg-gradient-to-tr from-purple-600 to-pink-400" />
          </div>

          {/* 6. Google Search Bar Capsule (Bottom) */}
          <div className="bg-[#1F2C1A]/80 backdrop-blur-xl h-14 rounded-full flex items-center justify-between px-4 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-white font-serif">G</span>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <Mic size={20} className="cursor-pointer hover:text-white" />
              <Camera size={20} className="cursor-pointer hover:text-white" />
              <Sparkles size={20} className="cursor-pointer hover:text-white" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

interface AppIconProps {
  icon: any;
  label: string;
  bgColor: string;
  iconColor?: string;
  onClick?: () => void;
}

function AppIcon({ icon: Icon, label, bgColor, iconColor = "text-white", onClick }: AppIconProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={onClick}>
      <div className={`w-14 h-14 rounded-[1.75rem] flex items-center justify-center shadow-lg transform transition-transform active:scale-95 ${bgColor}`}>
        <Icon size={24} className={`${iconColor}`} />
      </div>
      <span className="text-[11px] text-white font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis w-14 text-center">
        {label}
      </span>
    </div>
  );
}

function ClothedAppIcon({ icon: Icon, label, bgColor, iconColor = "text-white", href }: AppIconProps & { href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1.5 cursor-pointer">
      <div className={`w-14 h-14 rounded-[1.75rem] flex items-center justify-center shadow-lg transform transition-transform active:scale-95 ${bgColor}`}>
        <Icon size={24} className={`${iconColor}`} />
      </div>
      <span className="text-[11px] text-white font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis w-14 text-center">
        {label}
      </span>
    </Link>
  );
}

function AppIconNoLabel({ icon: Icon, bgColor, iconColor = "text-white", onClick }: { icon: any; bgColor: string; iconColor?: string; onClick?: () => void }) {
  return (
    <div className="flex flex-col items-center cursor-pointer" onClick={onClick}>
      <div className={`w-14 h-14 rounded-[1.75rem] flex items-center justify-center shadow-lg transform transition-transform active:scale-95 ${bgColor}`}>
        <Icon size={24} className={`${iconColor}`} />
      </div>
    </div>
  );
}

function ClothedAppIconNoLabel({ icon: Icon, bgColor, iconColor = "text-white", href }: { icon: any; bgColor: string; iconColor?: string; href: string }) {
  return (
    <Link href={href} className="flex flex-col items-center cursor-pointer">
      <div className={`w-14 h-14 rounded-[1.75rem] flex items-center justify-center shadow-lg transform transition-transform active:scale-95 ${bgColor}`}>
        <Icon size={24} className={`${iconColor}`} />
      </div>
    </Link>
  );
}
