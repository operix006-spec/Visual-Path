"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isNewShoot = pathname === "/";

  return (
    <header className="w-full border-b border-[#1E2D4A] bg-[#070B14]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
            <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[#F8FAFC] group-hover:text-white transition-colors">
              Visual Path
            </span>
          </Link>
          <span className="text-[#1E2D4A]">/</span>
          <span className="text-[11px] uppercase tracking-wider font-medium text-[#94A3B8]">
            Studio Organizer
          </span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
            v2.0
          </span>
        </div>

        {/* Right: Actions / Links */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className={`text-[12px] font-medium transition-colors px-2.5 py-1 rounded ${
              isNewShoot
                ? "text-[#F8FAFC] bg-[#162035] border border-[#1E2D4A]"
                : "text-[#94A3B8] hover:text-[#F8FAFC]"
            }`}
          >
            New Shoot
          </Link>

          <div className="h-3 w-[1px] bg-[#1E2D4A]" />

          <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
            <span>Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
}
