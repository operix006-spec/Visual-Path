"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface SessionStatus {
  id: string;
  name: string;
  status: string;
  outputFilePath: string | null;
  classificationType?: string | null;
  customCategories?: string | null;
  stats: {
    totalImages: number;
    processedImages: number;
    categories?: Record<string, number>;
    sampleImageIds?: Record<string, string[]>;
  };
}

interface ImageRecord {
  id: string;
  originalFilename: string;
  aiClassification: string | null;
  aiConfidence: number | null;
  processingStatus: string;
  errorMessage: string | null;
  fileSize: number;
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [data, setData] = useState<SessionStatus | null>(null);
  const [imagesDetail, setImagesDetail] = useState<ImageRecord[]>([]);
  const [showInspector, setShowInspector] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

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

  useEffect(() => {
    if (data?.status === 'CANCELLED') {
      router.push('/');
    }
  }, [data?.status, router]);

  if (!data) {
    return (
      <main className="flex-1 flex items-center justify-center bg-[#070B14] text-[#94A3B8]">
        <div className="flex items-center gap-3 text-[13px]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-pulse" />
          <span>Loading shoot details...</span>
        </div>
      </main>
    );
  }

  const { status, stats, name } = data;
  const isDone = status === "COMPLETED" || status === "ZIP_READY";
  const percentage =
    stats.totalImages > 0
      ? Math.round((stats.processedImages / stats.totalImages) * 100)
      : 0;

  const categories = stats.categories || {};
  const sampleImageIds = stats.sampleImageIds || {};
  const categoryKeys = Object.keys(categories);

  const cleanFolderName = (key: string) => {
    switch (key) {
      case 'Dynamic_Action_Splash':
        return 'Dynamic Action & Splash';
      case 'Studio_Product':
        return 'Studio Product';
      case 'Lifestyle_Context':
        return 'Lifestyle & Context';
      case 'Macro_CloseUp':
        return 'Macro & Detail';
      case 'Creative_Mood_Lighting':
        return 'Creative Mood Lighting';
      default:
        return key.replace(/_/g, " ");
    }
  };

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
      {/* Top Breadcrumb / Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1E2D4A]">
        <div className="flex items-center gap-2 text-[12px] text-[#64748B]">
          <Link href="/" className="hover:text-[#F8FAFC] transition-colors">
            Shoots
          </Link>
          <span>/</span>
          <span className="text-[#F8FAFC] font-medium truncate max-w-xs">
            {name || "Untitled Shoot"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#64748B]">
            {stats.totalImages} images
          </span>
          <span className="text-[#1E2D4A]">·</span>
          <span
            className={`text-[11px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isDone
                ? "bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8]"
                : "bg-[#162035] border-[#1E2D4A] text-[#94A3B8]"
            }`}
          >
            {isDone ? "Completed" : "Processing"}
          </span>
        </div>
      </div>

      {!isDone ? (
        /* Focused Processing Experience */
        <div className="max-w-2xl mx-auto py-12">
          <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#38BDF8] mb-2">
            Organizing your shoot
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#F8FAFC] mb-2">
            Analyzing photographic styles
          </h1>
          <p className="text-[14px] text-[#94A3B8] mb-8">
            Analyzing image {stats.processedImages} of {stats.totalImages}
          </p>

          {/* Minimalist Progress Bar */}
          <div className="w-full bg-[#162035] h-2 rounded-full overflow-hidden border border-[#1E2D4A] mb-8">
            <div
              className="bg-gradient-to-r from-[#38BDF8] to-[#60A5FA] h-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Stepped Checklist */}
          <div className="border border-[#1E2D4A] rounded-xl bg-[#0E1626] divide-y divide-[#1E2D4A] text-[13px] shadow-lg">
            <div className="p-4 flex items-center justify-between">
              <span className="text-[#94A3B8]">1. Uploading originals</span>
              <span className="text-[#38BDF8] font-mono text-[12px]">Completed</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-[#94A3B8]">2. Image optimization</span>
              <span className="text-[#38BDF8] font-mono text-[12px]">Completed</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-[#94A3B8]">3. Photographic style analysis</span>
              <span className="text-[#F8FAFC] font-mono text-[12px]">
                {stats.processedImages} / {stats.totalImages}
              </span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-[#94A3B8]">4. Packaging structured ZIP</span>
              <span className="text-[#64748B] font-mono text-[12px]">
                {status === "BUILDING_OUTPUT" ? "Generating..." : "Waiting"}
              </span>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to cancel the analysis?')) {
                  await fetch(`/api/sessions/${id}/cancel`, { method: 'POST' });
                  router.push('/');
                }
              }}
              className="text-[13px] text-[#64748B] hover:text-[#EF4444] transition-colors border-b border-transparent hover:border-[#EF4444]"
            >
              Cancel Analysis
            </button>
          </div>
        </div>
      ) : (
        /* Results / Folder Workspace Experience */
        <div>
          {/* Header & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#38BDF8] mb-2">
                Shoot Results
              </div>
              <h1 className="text-3xl font-medium tracking-tight text-[#F8FAFC] mb-2">
                Your shoot is organized.
              </h1>
              <p className="text-[14px] text-[#94A3B8]">
                Your original images have been sorted into folders based on visual style.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => (window.location.href = `/api/sessions/${id}/download`)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#070B14] font-semibold text-[13px] rounded-lg transition-all shadow-lg shadow-[#38BDF8]/20 cursor-pointer active:translate-y-[1px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>Download organized shoot</span>
              </button>

              <button
                onClick={async () => {
                  if (!showInspector && imagesDetail.length === 0) {
                    setIsLoadingImages(true);
                    try {
                      const res = await fetch(`/api/sessions/${id}/images`);
                      if (res.ok) {
                        const json = await res.json();
                        setImagesDetail(json.images || []);
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsLoadingImages(false);
                    }
                  }
                  setShowInspector(!showInspector);
                }}
                className="px-4 py-2.5 text-[13px] text-[#94A3B8] hover:text-[#F8FAFC] bg-[#0E1626] hover:bg-[#162035] border border-[#1E2D4A] hover:border-[#2E436B] rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{isLoadingImages ? "Loading..." : showInspector ? "Hide Details" : "Inspect Classifications"}</span>
              </button>

              <button
                onClick={() => router.push("/")}
                className="px-4 py-2.5 text-[13px] text-[#94A3B8] hover:text-[#F8FAFC] bg-[#0E1626] hover:bg-[#162035] border border-[#1E2D4A] hover:border-[#2E436B] rounded-lg transition-colors"
              >
                Organize another shoot
              </button>
            </div>
          </div>

          {/* Subtext with ZIP Details */}
          <div className="flex items-center gap-2 text-[12px] text-[#64748B] mb-8 pb-4 border-b border-[#1E2D4A]">
            <span className="font-mono text-[#38BDF8]">
              {(name || "organized-shoot").replace(/\s+/g, "_")}.zip
            </span>
            <span>·</span>
            <span>{stats.totalImages} original resolution files</span>
            <span>·</span>
            <span>{categoryKeys.length} {categoryKeys.length === 1 ? "folder" : "folders"} created</span>
          </div>

          {/* FOLDERS / COLLECTIONS Section (Visual Workspace) */}
          <div className="mb-10">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#38BDF8] mb-4">
              Organized Folders
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryKeys.map((cat) => {
                const count = categories[cat];
                const thumbs = sampleImageIds[cat] || [];

                return (
                  <div
                    key={cat}
                    className="border border-[#1E2D4A] hover:border-[#2E436B] rounded-xl bg-[#0E1626] p-4 transition-all duration-200 group flex flex-col justify-between shadow-lg hover:shadow-cyan-950/20"
                  >
                    {/* Folder Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg border border-[#1E2D4A] bg-[#162035] flex items-center justify-center text-[#38BDF8] group-hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.75}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[14px] font-medium text-[#F8FAFC]">
                            {cleanFolderName(cat)}
                          </div>
                          <div className="text-[11px] text-[#64748B]">
                            {count} {count === 1 ? "photo" : "photos"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Real Image Thumbnail Composition */}
                    <div className="w-full aspect-[4/3] rounded-lg border border-[#1E2D4A] bg-[#070B14] overflow-hidden p-1">
                      {thumbs.length >= 4 ? (
                        /* 2x2 Thumbnail Grid */
                        <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-full">
                          {thumbs.slice(0, 4).map((imgId) => (
                            <div key={imgId} className="w-full h-full overflow-hidden rounded-[3px] bg-[#162035]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/images/${imgId}`}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      ) : thumbs.length > 1 ? (
                        /* Split Thumbnails */
                        <div className="grid grid-cols-2 gap-1 w-full h-full">
                          {thumbs.map((imgId) => (
                            <div key={imgId} className="w-full h-full overflow-hidden rounded-[3px] bg-[#162035]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/images/${imgId}`}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      ) : thumbs.length === 1 ? (
                        /* Single Hero Thumbnail */
                        <div className="w-full h-full overflow-hidden rounded-[3px] bg-[#162035]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/images/${thumbs[0]}`}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        /* No preview available */
                        <div className="w-full h-full flex items-center justify-center text-[11px] text-[#64748B]">
                          No preview
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* INSPECTION TABLE SECTION */}
          {showInspector && (
            <div className="border border-[#1E2D4A] rounded-xl bg-[#0E1626] p-6 mb-8 shadow-xl animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-medium text-[#F8FAFC]">Image Classification Details</h3>
                  <p className="text-[12px] text-[#64748B]">Review raw AI visual style classification and confidence score per image</p>
                </div>
                <span className="text-[11px] font-mono text-[#38BDF8]">{imagesDetail.length} images</span>
              </div>

              <div className="max-h-96 overflow-y-auto border border-[#1E2D4A] rounded-lg divide-y divide-[#1E2D4A]">
                {imagesDetail.map((img) => (
                  <div key={img.id} className="p-3 text-[12px] flex items-center justify-between hover:bg-[#162035]/50 transition-colors">
                    <div className="flex items-center gap-3 truncate max-w-sm">
                      <span className="font-mono text-[#F8FAFC] truncate">{img.originalFilename}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {img.errorMessage && (
                        <span className="text-[11px] text-[#EF4444] truncate max-w-xs">{img.errorMessage}</span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] border font-medium ${
                        img.aiClassification === 'Uncategorized' 
                          ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
                          : 'bg-[#162035] border-[#1E2D4A] text-[#38BDF8]'
                      }`}>
                        {img.aiClassification || 'Pending'}
                      </span>
                      {img.aiConfidence !== null && (
                        <span className="text-[11px] text-[#64748B] font-mono w-12 text-right">
                          {Math.round(img.aiConfidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
