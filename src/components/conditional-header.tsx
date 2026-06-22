"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Hide the global header for any during-trip routes (mobile views)
  if (pathname?.startsWith("/during-trip")) {
    return null;
  }

  return <SiteHeader />;
}
