"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isNewShoot = pathname === "/";

  return (
    <header className="w-full border-b border-[#242428] bg-[#0B0B0D] sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-[#F5F5F5] group-hover:text-white transition-colors">
              Visual Path
            </span>
          </Link>
          <span className="text-[#242428]">/</span>
          <span className="text-[11px] uppercase tracking-wider font-medium text-[#71717A]">
            Studio Organizer
          </span>
        </div>

        {/* Right: Actions / Links */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className={`text-[12px] font-medium transition-colors px-2.5 py-1 rounded ${
              isNewShoot
                ? "text-[#F5F5F5] bg-[#17171A]"
                : "text-[#71717A] hover:text-[#F5F5F5]"
            }`}
          >
            New Shoot
          </Link>

          <div className="h-3 w-[1px] bg-[#242428]" />

          <div className="flex items-center gap-2 text-[11px] text-[#71717A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38383E]" />
            <span>Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
}
