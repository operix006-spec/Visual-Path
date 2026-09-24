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
      <main className="flex-1 flex items-center justify-center bg-[#0B0B0D] text-[#A1A1AA]">
        <div className="flex items-center gap-3 text-[13px]">
          <span className="w-2 h-2 rounded-full bg-[#71717A] animate-pulse" />
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
    return key.replace(/_/g, " ");
  };

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
      {/* Top Breadcrumb / Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#242428]">
        <div className="flex items-center gap-2 text-[12px] text-[#71717A]">
          <Link href="/" className="hover:text-[#F5F5F5] transition-colors">
            Shoots
          </Link>
          <span>/</span>
          <span className="text-[#F5F5F5] font-medium truncate max-w-xs">
            {name || "Untitled Shoot"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#71717A]">
            {stats.totalImages} images
          </span>
          <span className="text-[#242428]">·</span>
          <span
            className={`text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded border ${
              isDone
                ? "bg-[#17171A] border-[#242428] text-[#F5F5F5]"
                : "bg-[#121214] border-[#242428] text-[#A1A1AA]"
            }`}
          >
            {isDone ? "Completed" : "Processing"}
          </span>
        </div>
      </div>

      {!isDone ? (
        /* Focused Processing Experience */
        <div className="max-w-2xl mx-auto py-12">
          <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#71717A] mb-2">
            Organizing your shoot
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#F5F5F5] mb-2">
            Analyzing photographic styles
          </h1>
          <p className="text-[14px] text-[#A1A1AA] mb-8">
            Analyzing image {stats.processedImages} of {stats.totalImages}
          </p>

          {/* Minimalist Progress Bar */}
          <div className="w-full bg-[#121214] h-1.5 rounded-full overflow-hidden border border-[#242428] mb-8">
            <div
              className="bg-[#F5F5F5] h-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Stepped Checklist */}
          <div className="border border-[#242428] rounded-lg bg-[#121214] divide-y divide-[#242428] text-[13px]">
            <div className="p-4 flex items-center justify-between">
              <span className="text-[#A1A1AA]">1. Uploading originals</span>
              <span className="text-[#F5F5F5] font-mono text-[12px]">Completed</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-[#A1A1AA]">2. Image optimization</span>
              <span className="text-[#F5F5F5] font-mono text-[12px]">Completed</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-[#A1A1AA]">3. Photographic style analysis</span>
              <span className="text-[#F5F5F5] font-mono text-[12px]">
                {stats.processedImages} / {stats.totalImages}
              </span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-[#A1A1AA]">4. Packaging structured ZIP</span>
              <span className="text-[#71717A] font-mono text-[12px]">
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
              className="text-[13px] text-[#71717A] hover:text-[#EF4444] transition-colors border-b border-transparent hover:border-[#EF4444]"
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
              <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#71717A] mb-2">
                Shoot Results
              </div>
              <h1 className="text-3xl font-medium tracking-tight text-[#F5F5F5] mb-2">
                Your shoot is organized.
              </h1>
              <p className="text-[14px] text-[#A1A1AA]">
                Your original images have been sorted into folders based on visual style.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => (window.location.href = `/api/sessions/${id}/download`)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#F5F5F5] hover:bg-[#E4E4E7] text-[#0B0B0D] font-medium text-[13px] rounded transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
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
                className="px-4 py-2.5 text-[13px] text-[#A1A1AA] hover:text-[#F5F5F5] bg-[#121214] hover:bg-[#17171A] border border-[#242428] rounded transition-colors flex items-center justify-center gap-2"
              >
                <span>{isLoadingImages ? "Loading..." : showInspector ? "Hide Details" : "Inspect Classifications"}</span>
              </button>

              <button
                onClick={() => router.push("/")}
                className="px-4 py-2.5 text-[13px] text-[#A1A1AA] hover:text-[#F5F5F5] bg-[#121214] hover:bg-[#17171A] border border-[#242428] rounded transition-colors"
              >
                Organize another shoot
              </button>
            </div>
          </div>

          {/* Subtext with ZIP Details */}
          <div className="flex items-center gap-2 text-[12px] text-[#71717A] mb-8 pb-4 border-b border-[#242428]">
            <span className="font-mono text-[#A1A1AA]">
              {(name || "organized-shoot").replace(/\s+/g, "_")}.zip
            </span>
            <span>·</span>
            <span>{stats.totalImages} original resolution files</span>
            <span>·</span>
            <span>{categoryKeys.filter(k => (categories[k] || 0) > 0).length} folders populated</span>
            {data.classificationType && data.classificationType !== 'auto' && (
              <>
                <span>·</span>
                <span className="text-[#A1A1AA]">Strategy: {data.classificationType}</span>
              </>
            )}
          </div>

          {/* FOLDERS / COLLECTIONS Section (Visual Workspace) */}
          <div className="mb-10">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#71717A] mb-4">
              Folders ({categoryKeys.length} categories)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryKeys.map((cat) => {
                const count = categories[cat];
                const thumbs = sampleImageIds[cat] || [];

                return (
                  <div
                    key={cat}
                    className="border border-[#242428] hover:border-[#38383E] rounded-lg bg-[#121214] p-4 transition-colors group flex flex-col justify-between"
                  >
                    {/* Folder Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded border border-[#242428] bg-[#17171A] flex items-center justify-center text-[#A1A1AA] group-hover:text-[#F5F5F5] transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.75}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-[#F5F5F5]">
                            {cleanFolderName(cat)}
                          </div>
                          <div className="text-[11px] text-[#71717A]">
                            {count} {count === 1 ? "photo" : "photos"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Real Image Thumbnail Composition */}
                    <div className="w-full aspect-[4/3] rounded border border-[#242428] bg-[#0B0B0D] overflow-hidden p-1">
                      {thumbs.length >= 4 ? (
                        /* 2x2 Thumbnail Grid */
                        <div className="grid grid-cols-2 grid-rows-2 gap-1 w-full h-full">
                          {thumbs.slice(0, 4).map((imgId) => (
                            <div key={imgId} className="w-full h-full overflow-hidden rounded-[2px] bg-[#17171A]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/images/${imgId}`}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      ) : thumbs.length > 1 ? (
                        /* Split Thumbnails */
                        <div className="grid grid-cols-2 gap-1 w-full h-full">
                          {thumbs.map((imgId) => (
                            <div key={imgId} className="w-full h-full overflow-hidden rounded-[2px] bg-[#17171A]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/images/${imgId}`}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      ) : thumbs.length === 1 ? (
                        /* Single Hero Thumbnail */
                        <div className="w-full h-full overflow-hidden rounded-[2px] bg-[#17171A]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/images/${thumbs[0]}`}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      ) : count === 0 ? (
                        /* Empty state inside folder */
                        <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 bg-[#17171A]/50 rounded-[2px]">
                          <span className="text-[12px] text-[#A1A1AA] font-medium mb-1">0 matching photos</span>
                          <span className="text-[10px] text-[#71717A]">AI found no photos matching this style</span>
                        </div>
                      ) : (
                        /* No preview available */
                        <div className="w-full h-full flex items-center justify-center text-[11px] text-[#71717A]">
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
            <div className="border border-[#242428] rounded-lg bg-[#121214] p-6 mb-8 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-medium text-[#F5F5F5]">Image Classification Details</h3>
                  <p className="text-[12px] text-[#71717A]">Review raw AI classification and confidence score per image</p>
                </div>
                <span className="text-[11px] font-mono text-[#A1A1AA]">{imagesDetail.length} images</span>
              </div>

              <div className="max-h-96 overflow-y-auto border border-[#242428] rounded divide-y divide-[#242428]">
                {imagesDetail.map((img) => (
                  <div key={img.id} className="p-3 text-[12px] flex items-center justify-between hover:bg-[#17171A]/40 transition-colors">
                    <div className="flex items-center gap-3 truncate max-w-sm">
                      <span className="font-mono text-[#F5F5F5] truncate">{img.originalFilename}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {img.errorMessage && (
                        <span className="text-[11px] text-[#EF4444] truncate max-w-xs">{img.errorMessage}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[11px] border font-medium ${
                        img.aiClassification === 'Uncategorized' 
                          ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
                          : 'bg-[#17171A] border-[#242428] text-[#F5F5F5]'
                      }`}>
                        {img.aiClassification || 'Pending'}
                      </span>
                      {img.aiConfidence !== null && (
                        <span className="text-[11px] text-[#71717A] font-mono w-12 text-right">
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
