"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface SessionStatus {
  id: string;
  name: string;
  status: string;
  outputFilePath: string | null;
  stats: {
    totalImages: number;
    processedImages: number;
    categories?: Record<string, number>;
  };
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [data, setData] = useState<SessionStatus | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/sessions/${id}/status`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Error fetching session status:", err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [id]);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#090A10] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          </div>
          <span className="text-sm font-medium text-neutral-400">Loading shoot details...</span>
        </div>
      </div>
    );
  }

  const { status, stats, name } = data;
  const isDone = status === "COMPLETED" || status === "ZIP_READY";
  const percentage = stats.totalImages > 0 ? Math.round((stats.processedImages / stats.totalImages) * 100) : 0;
  const categories = stats.categories || {};
  const categoryKeys = Object.keys(categories);

  const getStatusLabel = () => {
    switch (status) {
      case "UPLOADING":
        return { label: "Uploading Photos", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
      case "PROCESSING":
        return { label: "AI Vision Analysis", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" };
      case "BUILDING_OUTPUT":
        return { label: "Generating ZIP Archive", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" };
      case "ZIP_READY":
      case "COMPLETED":
        return { label: "Completed & Ready", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
      default:
        return { label: status, color: "text-neutral-400", bg: "bg-neutral-800 border-white/10" };
    }
  };

  const currentStatus = getStatusLabel();

  return (
    <div className="min-h-screen flex flex-col bg-[#090A10] text-neutral-100 relative overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient lighting */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] right-[-100px] w-[400px] h-[400px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full border-b border-white/[0.06] backdrop-blur-md bg-[#090A10]/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-white/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                Visual Path
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-medium px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-neutral-300 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Organize New Shoot</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 flex flex-col items-center justify-center">
        <div className="w-full glass-panel rounded-3xl border border-white/10 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Header & Status badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.08]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Active Photoshoot Session
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {name || "Untitled Shoot"}
              </h1>
            </div>

            <div className={`self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${currentStatus.bg} ${currentStatus.color}`}>
              {!isDone && <span className="w-2 h-2 rounded-full bg-current animate-ping" />}
              <span>{currentStatus.label}</span>
            </div>
          </div>

          {/* If ready to download */}
          {isDone ? (
            <div>
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-8 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl shrink-0">
                  🎉
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-300 mb-1">
                    Shoot Successfully Organized!
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    All {stats.totalImages} original photos have been analyzed and sorted into dedicated category folders inside your ZIP package.
                  </p>
                </div>
              </div>

              {/* Categorization Summary */}
              {categoryKeys.length > 0 && (
                <div className="mb-8">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                    Detected Categories in ZIP:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {categoryKeys.map((cat) => (
                      <div
                        key={cat}
                        className="glass-card rounded-xl p-3 border border-white/5 flex items-center justify-between"
                      >
                        <span className="text-xs font-medium text-neutral-200 capitalize">
                          {cat.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                          {categories[cat]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Download ZIP button */}
              <button
                onClick={() => (window.location.href = `/api/sessions/${id}/download`)}
                className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-3 text-base cursor-pointer hover:scale-[1.01] active:scale-[0.99] mb-4"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Organized ZIP</span>
              </button>

              <button
                onClick={() => router.push("/")}
                className="w-full bg-white/5 hover:bg-white/10 text-neutral-300 font-medium py-3 rounded-xl border border-white/10 transition-colors text-sm"
              >
                Organize Another Photoshoot
              </button>
            </div>
          ) : (
            /* If still processing */
            <div>
              {/* Progress Counters */}
              <div className="flex items-end justify-between mb-3">
                <div>
                  <div className="text-sm font-semibold text-neutral-300">
                    Processing Shoot Photos
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    Analyzing visuals & categorizing into folders
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-white">
                    {stats.processedImages}
                  </span>
                  <span className="text-sm text-neutral-400"> / {stats.totalImages}</span>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-neutral-800/80 rounded-full h-3 overflow-hidden p-0.5 border border-white/5 mb-8">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 relative"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Live Category Breakdown */}
              {categoryKeys.length > 0 && (
                <div className="mb-6">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                    Live Classification Breakdown:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {categoryKeys.map((cat) => (
                      <div
                        key={cat}
                        className="glass-card rounded-xl p-3 border border-white/5 flex items-center justify-between"
                      >
                        <span className="text-xs font-medium text-neutral-300 capitalize">
                          {cat.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                          {categories[cat]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-neutral-400">
                ⚡ Vision AI is analyzing each photo. The ZIP package will download automatically once finished.
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
