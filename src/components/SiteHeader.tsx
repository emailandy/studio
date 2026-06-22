"use client";

import Link from "next/link";
import { Search, Gift, XIcon } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export function SiteHeader() {
  const [showIframe, setShowIframe] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
    <header className="w-full flex flex-col z-50 sticky top-0 bg-white">
      {/* Promo Bar */}
      <div className="w-full bg-blue-600 text-white py-2 text-sm text-center font-medium">
        Game On Getaways: Score $25 off your next trip. Valid on all Express Deals® of $275+. Use code: <span className="font-bold">GAMEON</span>{" "}
        <Link href="#" className="underline font-semibold ml-1">
          Learn More
        </Link>
      </div>

      {/* Main Navigation Bar */}
      <div className="w-full bg-white border-b border-gray-200 h-16 flex items-center shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {/* Branding Placeholder - Swap this out easily */}
            <Link href="/" className="flex items-center">
              <Image src="/trvlr-logo.png" alt="trvlr logo" width={100} height={35} className="h-8 w-auto" />
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Hotels</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Cars</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Flights</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Packages</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Cruises</Link>
              <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600">Experiences</Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/during-trip?view=mobile-call" className="flex items-center space-x-2 border border-gray-300 rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">A</div>
              <span>AI Assist</span>
            </Link>
            
            <Link href="#" className="text-sm font-medium text-gray-700 hover:text-blue-600 hidden sm:inline">Help</Link>
            <Link href="/saved-trips" className="text-sm font-medium text-gray-700 hover:text-blue-600 hidden sm:inline">Find My Trip</Link>
            
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Hello, {user.displayName || user.email}</span>
                <button 
                  onClick={() => signOut(auth)}
                  className="border border-red-600 text-red-600 rounded-full px-4 py-1.5 text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="#" className="border border-blue-600 text-blue-600 rounded-full px-4 py-1.5 text-sm font-medium hover:bg-blue-50">
                Sign In <span className="font-bold text-xs uppercase text-blue-800 ml-1">Join VIP</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
    {showIframe && (
      <div className="fixed bottom-4 right-4 w-[50vw] h-[50vh] z-[100] bg-white p-4 rounded-2xl shadow-2xl flex flex-col border border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">A</div>
            AI Assist
          </h2>
          <button className="text-gray-500 hover:text-gray-800 p-1.5 h-auto flex items-center rounded-full hover:bg-slate-100" onClick={() => setShowIframe(false)}>
            <XIcon size={16} />
          </button>
        </div>
        <div className="flex-grow w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-black flex items-center justify-center">
           <video 
             src="/videos/priceline_gecx_demo_2.webm" 
             className="w-full h-full object-contain" 
             controls 
             autoPlay
           />
        </div>
      </div>
    )}
    </>
  );
}
