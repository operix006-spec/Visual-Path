"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface StagedFile {
  file: File;
  previewUrl: string;
}

export default function Home() {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [shootName, setShootName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const imageFiles: StagedFile[] = [];
    let detectedFolderName = "";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/") || /\.(jpe?g|png|webp|tiff?|avif|cr2|nef|arw|dng)$/i.test(file.name)) {
        if (!detectedFolderName && (file as any).webkitRelativePath) {
          const parts = (file as any).webkitRelativePath.split("/");
          if (parts.length > 1) {
            detectedFolderName = parts[0];
          }
        }
        imageFiles.push({
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }
    }

    if (imageFiles.length === 0) {
      alert("No valid images found in the selected folder.");
      return;
    }

    setStagedFiles(imageFiles);
    if (detectedFolderName && !shootName) {
      setShootName(detectedFolderName.replace(/[-_]/g, " "));
    }
  };

  const handleStartProcessing = async () => {
    if (stagedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentFileIndex(0);

    try {
      const sessionRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: shootName.trim() || "Untitled Shoot",
        }),
      });
      const session = await sessionRes.json();

      if (!session.id) throw new Error("Failed to initialize session");

      // Upload Files sequentially
      const total = stagedFiles.length;
      for (let i = 0; i < total; i++) {
        setCurrentFileIndex(i + 1);
        const { file } = stagedFiles[i];

        const formData = new FormData();
        formData.append("file", file);

        await fetch(`/api/sessions/${session.id}/upload`, {
          method: "POST",
          body: formData,
        });

        setUploadProgress(Math.round(((i + 1) / total) * 100));
      }

      // Trigger processing pipeline
      await fetch(`/api/sessions/${session.id}/process`, { method: "POST" }).catch(() => {});

      // Redirect to processing/results view
      router.push(`/session/${session.id}`);
    } catch (error) {
      console.error(error);
      alert("An error occurred during upload. Please try again.");
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    stagedFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setStagedFiles([]);
    setShootName("");
    setUploadProgress(0);
    setIsUploading(false);
  };

  const totalSizeMB = (
    stagedFiles.reduce((acc, curr) => acc + curr.file.size, 0) /
    (1024 * 1024)
  ).toFixed(1);

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 flex flex-col justify-center">
      {/* View Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#38BDF8]">
            Automated Studio Organizer
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 font-mono">
            New Version
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#F8FAFC] mb-2">
          Organize a photoshoot in seconds.
        </h1>
        <p className="text-[14px] text-[#94A3B8]">
          Drop your unedited folder to automatically categorize and package original files by visual photographic style.
        </p>
      </div>

      {/* Main Upload Box */}
      {stagedFiles.length === 0 ? (
        /* Empty Dropzone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) {
              handleFilesSelected(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border rounded-xl p-16 sm:p-20 text-center transition-all cursor-pointer select-none bg-[#0E1626] shadow-xl ${
            isDragging
              ? "border-[#38BDF8] bg-[#162035]"
              : "border-[#1E2D4A] hover:border-[#2E436B] hover:bg-[#121B2F]"
          }`}
        >
          <div className="max-w-sm mx-auto flex flex-col items-center">
            {/* Folder icon */}
            <div className="w-12 h-12 rounded-xl border border-[#1E2D4A] bg-[#162035] flex items-center justify-center text-[#38BDF8] mb-4 shadow-inner">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>

            <p className="text-[15px] font-medium text-[#F8FAFC] mb-1">
              Drop your photoshoot folder here
            </p>
            <p className="text-[12px] text-[#64748B] mb-4">or</p>

            <button
              type="button"
              className="px-5 py-2.5 text-[13px] font-medium text-[#F8FAFC] bg-[#162035] hover:bg-[#1E2D4A] border border-[#1E2D4A] hover:border-[#2E436B] rounded-lg transition-colors shadow-sm"
            >
              Browse folder
            </button>

            <div className="mt-8 pt-6 border-t border-[#1E2D4A]/60 w-full">
              <p className="text-[11px] text-[#64748B] tracking-wide">
                RAW, JPEG, PNG, TIFF · Full original resolution preserved
              </p>
            </div>
          </div>
        </div>
      ) : isUploading ? (
        /* Focused Uploading State */
        <div className="border border-[#1E2D4A] rounded-xl bg-[#0E1626] p-12 text-center shadow-xl">
          <div className="max-w-md mx-auto">
            <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#38BDF8] mb-2">
              Transferring
            </div>
            <h2 className="text-xl font-medium text-[#F8FAFC] mb-1">
              Uploading original photos
            </h2>
            <p className="text-[13px] text-[#94A3B8] mb-6">
              File {currentFileIndex} of {stagedFiles.length}
            </p>

            <div className="w-full bg-[#162035] h-2 rounded-full overflow-hidden mb-3 border border-[#1E2D4A]">
              <div
                className="bg-gradient-to-r from-[#38BDF8] to-[#60A5FA] h-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-[#64748B]">
              <span>Original resolution</span>
              <span>{uploadProgress}%</span>
            </div>
          </div>
        </div>
      ) : (
        /* Staged Review & Analyze State */
        <div className="border border-[#1E2D4A] rounded-xl bg-[#0E1626] p-6 sm:p-8 shadow-xl">
          {/* Metadata Bar */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#1E2D4A]">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#38BDF8] mb-1">
                Folder Selected
              </div>
              <div className="text-[15px] font-medium text-[#F8FAFC]">
                {stagedFiles.length} images · {totalSizeMB} MB
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-[12px] text-[#94A3B8] hover:text-[#F8FAFC] px-3 py-1.5 border border-[#1E2D4A] hover:border-[#2E436B] rounded-lg transition-colors bg-[#162035]"
            >
              Change folder
            </button>
          </div>

          {/* Shoot Name Field */}
          <div className="mb-6">
            <label className="block text-[11px] font-semibold tracking-[0.16em] uppercase text-[#64748B] mb-2">
              Shoot Name
            </label>
            <input
              type="text"
              value={shootName}
              onChange={(e) => setShootName(e.target.value)}
              placeholder="e.g. Campaign Lookbook"
              className="w-full bg-[#070B14] border border-[#1E2D4A] focus:border-[#38BDF8] rounded-lg px-3.5 py-2.5 text-[14px] text-[#F8FAFC] placeholder-[#64748B] outline-none transition-colors"
            />
          </div>

          {/* Photographic Style Structure Overview */}
          <div className="mb-6 p-4 rounded-xl border border-[#1E2D4A] bg-[#070B14]">
            <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#38BDF8] mb-2">
              Automatic Organization Pipeline
            </div>
            <p className="text-[12px] text-[#94A3B8] mb-3">
              The AI will inspect every image and automatically sort it into professional photographic styles:
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-[#162035] border border-[#1E2D4A] text-[12px] text-[#F8FAFC]">
                ⚡ Dynamic Action & Splash
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#162035] border border-[#1E2D4A] text-[12px] text-[#F8FAFC]">
                📦 Studio Product
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#162035] border border-[#1E2D4A] text-[12px] text-[#F8FAFC]">
                ☕ Lifestyle Context
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#162035] border border-[#1E2D4A] text-[12px] text-[#F8FAFC]">
                🔍 Macro Detail
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#162035] border border-[#1E2D4A] text-[12px] text-[#F8FAFC]">
                🎬 Creative Mood Lighting
              </span>
            </div>
          </div>

          {/* Thumbnail Preview Strip */}
          <div className="mb-8">
            <div className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#64748B] mb-3">
              Preview (First {Math.min(stagedFiles.length, 12)} of {stagedFiles.length})
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
              {stagedFiles.slice(0, 12).map((item, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg border border-[#1E2D4A] bg-[#070B14] overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleStartProcessing}
            className="w-full bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#070B14] font-semibold text-[14px] py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#38BDF8]/20 active:translate-y-[1px]"
          >
            <span>Organize Shoot</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      )}

      {/* Hidden native folder input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="hidden"
        /* @ts-expect-error webkitdirectory folder upload */
        webkitdirectory="true"
        directory="true"
        multiple
      />
    </main>
  );
}
