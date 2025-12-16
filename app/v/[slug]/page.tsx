"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchProxy, decodeBase64, parseHTML, encodeBase64 } from "@/lib/utils";
import { Download, Play, ChevronLeft, Calendar, Film, AlertCircle, PlayCircle, PackageCheck } from "lucide-react";

export default function MoviePage() {
  const params = useParams();
  const router = useRouter();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  
  // Navigation State
  const [view, setView] = useState<"info" | "mode_select" | "quality_select">("info");
  const [downloadMode, setDownloadMode] = useState<"episode" | "batch">("episode");

  useEffect(() => {
    const init = async () => {
      try {
        if (!params.slug) return;
        
        // Decode URL
        const slugStr = Array.isArray(params.slug) ? params.slug[0] : params.slug;
        const cleanSlug = decodeURIComponent(slugStr);
        const decoded = decodeBase64(cleanSlug);
        
        if (!decoded.includes("|||")) throw new Error("Invalid URL Format");

        const [slug, baseUrl] = decoded.split("|||");
        const targetUrl = `${baseUrl}/${slug}/`;

        const html = await fetchProxy(targetUrl);
        if (!html) throw new Error("Failed to fetch data");
        
        const doc = parseHTML(html);

        // --- 1. Basic Info Scraping ---
        const title = doc.querySelector("h1")?.textContent?.trim() || "Unknown Title";
        const poster = doc.querySelector(".post-thumbnail img")?.getAttribute("src") || "";
        const description = doc.querySelector("h3 + p")?.textContent?.trim();

        // --- 2. Advanced Link Extraction (Series Logic) ---
        const episodeLinks: any[] = [];
        const batchLinks: any[] = [];

        const qualityHeaders = doc.querySelectorAll(".download-links-div h4");
        
        qualityHeaders.forEach((h4) => {
            const rawText = h4.textContent || "";
            const linkDiv = h4.nextElementSibling;
            
            if (linkDiv && linkDiv.classList.contains("downloads-btns-div")) {
                
                // Parse Resolution
                const resMatch = rawText.match(/(\d{3,4}p)/);
                const res = resMatch ? resMatch[0] : "HD";
                const isHEVC = rawText.toLowerCase().includes("hevc");

                // A. Find Normal Links (Episode Wise) -> class="btn" but NOT "btn-zip"
                const normalBtn = linkDiv.querySelector("a.btn:not(.btn-zip)");
                if (normalBtn) {
                     // Size for episodes is usually in header like [180MB/E]
                     const sizeMatch = rawText.match(/\[(\d+(\.\d+)?[GM]B)(\/E)?\]/);
                     const size = sizeMatch ? sizeMatch[1] : "N/A";

                     episodeLinks.push({
                        label: rawText,
                        res,
                        size,
                        url: normalBtn.getAttribute("href"),
                        isHEVC
                     });
                }

                // B. Find Zip/Batch Links -> class="btn btn-zip"
                const zipBtn = linkDiv.querySelector("a.btn-zip");
                if (zipBtn) {
                    // Size for batch is usually inside the button text like "BATCH/ZIP [7.9GB]"
                    const btnText = zipBtn.textContent || "";
                    const sizeMatch = btnText.match(/\[(\d+(\.\d+)?[GM]B)\]/);
                    const size = sizeMatch ? sizeMatch[1] : "Unknown";

                    batchLinks.push({
                        label: rawText.replace("Episode", "Complete Season"),
                        res,
                        size, // Batch size is large
                        url: zipBtn.getAttribute("href"),
                        isHEVC
                    });
                }
            }
        });

        const isSeries = batchLinks.length > 0;

        setData({ title, poster, description, episodeLinks, batchLinks, isSeries });
        setLoading(false);

      } catch (e: any) {
        console.error(e);
        setError("Failed to load content. Please try again.");
        setLoading(false);
      }
    };

    init();
  }, [params.slug]);

  // Handle Initial Download Click
  const onDownloadClick = () => {
      if (data.isSeries) {
          setView("mode_select"); // Show Episode vs Bulk
      } else {
          setDownloadMode("episode");
          setView("quality_select"); // Direct to quality for movies
      }
  };

  // Handle Mode Selection (Series Only)
  const selectMode = (mode: "episode" | "batch") => {
      setDownloadMode(mode);
      setView("quality_select");
  };

  // Handle Final Link Click
  const proceedToDrive = (item: any) => {
    const keyPayload = JSON.stringify({
        link: item.url,
        tmdb: "custom"
    });
    const key = encodeBase64(keyPayload);
    // Clean quality label for API matching
    const quality = encodeURIComponent(item.label);
    
    router.push(`/vlyxdrive?key=${key}&action=download&quality=${quality}`);
  };

  // --- RENDERING ---

  if (loading) return (
      <div className="min-h-screen bg-black p-6 space-y-6 flex flex-col items-center pt-20">
          <div className="w-40 h-60 bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-8 w-3/4 bg-gray-800 rounded animate-pulse"></div>
      </div>
  );

  if (error) return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-500 p-4">
          <AlertCircle size={48} />
          <p className="mt-4">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-white/10 rounded-full text-white">Retry</button>
      </div>
  );

  return (
    <div className="min-h-screen bg-black pb-20 text-white">
      
      {/* Background Image */}
      <div className="absolute top-0 left-0 w-full h-[50vh] overflow-hidden z-0 pointer-events-none">
          <img src={data?.poster} className="w-full h-full object-cover opacity-20 blur-3xl" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-10">
        
        {/* === VIEW 1: MOVIE INFO === */}
        {view === "info" && (
            <>
                <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-gray-300 hover:text-white transition">
                    <ChevronLeft /> Back
                </button>
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <img src={data?.poster} className="w-64 rounded-xl shadow-2xl shadow-red-900/20 border border-white/10" alt={data?.title} />
                    <div className="space-y-6 text-center md:text-left w-full">
                        <h1 className="text-3xl md:text-5xl font-bold leading-tight">{data?.title}</h1>
                        <p className="text-gray-300 leading-relaxed text-sm md:text-base line-clamp-4 max-w-2xl">
                            {data?.description}
                        </p>
                        <div className="flex flex-col gap-3 pt-4 max-w-md mx-auto md:mx-0">
                             <button onClick={onDownloadClick} className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95">
                                <Download size={24} /> Download Options
                             </button>
                             <button className="bg-white/10 hover:bg-white/20 text-white p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all">
                                <Play size={24} /> Watch Trailer
                             </button>
                        </div>
                    </div>
                </div>
            </>
        )}

        {/* === VIEW 2: MODE SELECTION (SERIES ONLY) === */}
        {view === "mode_select" && (
            <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
                <button onClick={() => setView("info")} className="mb-6 text-gray-400 flex items-center gap-2 hover:text-white">
                    <ChevronLeft /> Back to info
                </button>
                
                <h2 className="text-2xl font-bold text-center mb-2">Download Type</h2>
                <p className="text-center text-gray-400 mb-8">Choose how you want to download this content</p>

                <div className="space-y-4">
                    <button onClick={() => selectMode("episode")} className="w-full bg-green-900/20 border border-green-500/30 hover:bg-green-900/40 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all group">
                        <PlayCircle className="w-12 h-12 text-green-500 group-hover:scale-110 transition-transform" />
                        <div className="text-center">
                            <h3 className="font-bold text-xl text-white">Episode-wise</h3>
                            <p className="text-sm text-gray-400">Download individual episodes</p>
                        </div>
                    </button>

                    <button onClick={() => selectMode("batch")} className="w-full bg-purple-900/20 border border-purple-500/30 hover:bg-purple-900/40 p-6 rounded-2xl flex flex-col items-center gap-3 transition-all group">
                        <PackageCheck className="w-12 h-12 text-purple-500 group-hover:scale-110 transition-transform" />
                        <div className="text-center">
                            <h3 className="font-bold text-xl text-white">Bulk Download</h3>
                            <p className="text-sm text-gray-400">Download complete season (Zip)</p>
                        </div>
                    </button>
                </div>
            </div>
        )}

        {/* === VIEW 3: QUALITY SELECTION === */}
        {view === "quality_select" && (
            <div className="max-w-lg mx-auto animate-in zoom-in-95 duration-300">
                <button 
                    onClick={() => data.isSeries ? setView("mode_select") : setView("info")} 
                    className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition"
                >
                    <ChevronLeft /> Back
                </button>

                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                    Select Quality
                    {downloadMode === "batch" && <span className="block text-sm text-purple-400 font-normal mt-1">(Batch/Zip Files)</span>}
                </h2>

                <div className="space-y-3 mt-6">
                    {/* Render Links based on Mode */}
                    {(downloadMode === "episode" ? data.episodeLinks : data.batchLinks).map((item: any, i: number) => (
                        <button
                        key={i}
                        onClick={() => proceedToDrive(item)}
                        className={`w-full p-4 rounded-xl flex items-center justify-between group transition-all active:scale-95 border
                            ${downloadMode === 'batch' 
                                ? 'bg-purple-900/10 border-purple-500/30 hover:bg-purple-900/30' 
                                : 'bg-gray-900 border-gray-800 hover:border-blue-500 hover:bg-gray-800'
                            }`}
                        >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${downloadMode === 'batch' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                {downloadMode === 'batch' ? <PackageCheck size={20} /> : <Download size={20} />}
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-white text-lg flex items-center gap-2">
                                    {item.res} 
                                    {item.isHEVC && <span className="text-[10px] bg-red-600 px-1.5 py-0.5 rounded text-white">HEVC</span>}
                                </div>
                                <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {downloadMode === 'episode' ? "Single Episode Link" : "Complete Season Zip"}
                                </div>
                            </div>
                        </div>
                        <div className="bg-black/40 px-3 py-1 rounded-lg text-xs font-mono text-gray-300 border border-white/5">
                            {item.size}
                        </div>
                        </button>
                    ))}

                    {/* Empty State */}
                    {(downloadMode === "episode" ? data.episodeLinks : data.batchLinks).length === 0 && (
                        <div className="text-center p-8 bg-gray-900 rounded-xl border border-gray-800">
                            <p className="text-gray-400">No links available for this mode.</p>
                            <button onClick={() => setView("mode_select")} className="text-blue-400 text-sm mt-2 hover:underline">Try other mode</button>
                        </div>
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
                  }
