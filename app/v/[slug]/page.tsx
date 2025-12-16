"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchProxy, decodeBase64, parseHTML, encodeBase64 } from "@/lib/utils";
import { 
  Download, 
  Play, 
  ChevronLeft, 
  Calendar, 
  Film, 
  AlertCircle, 
  PlayCircle, 
  PackageCheck,
  Star,
  Clock,
  ShieldCheck
} from "lucide-react";

export default function MoviePage() {
  const params = useParams();
  const router = useRouter();
  
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  
  // Views: 'info' -> 'mode_select' (Series) -> 'quality_select'
  const [view, setView] = useState<"info" | "mode_select" | "quality_select">("info");
  const [downloadMode, setDownloadMode] = useState<"episode" | "batch">("episode");

  // --- LOGIC (SAME AS BEFORE) ---
  useEffect(() => {
    const init = async () => {
      try {
        if (!params.slug) return;
        const slugStr = Array.isArray(params.slug) ? params.slug[0] : params.slug;
        const cleanSlug = decodeURIComponent(slugStr);
        const decoded = decodeBase64(cleanSlug);
        
        if (!decoded.includes("|||")) throw new Error("Invalid Link");

        const [slug, baseUrl] = decoded.split("|||");
        const targetUrl = `${baseUrl}/${slug}/`;

        const html = await fetchProxy(targetUrl);
        if (!html) throw new Error("Failed to load");
        
        const doc = parseHTML(html);

        const title = doc.querySelector("h1")?.textContent?.trim() || "Unknown Title";
        const poster = doc.querySelector(".post-thumbnail img")?.getAttribute("src") || "";
        const description = doc.querySelector("h3 + p")?.textContent?.trim() || "No description available.";
        
        const episodeLinks: any[] = [];
        const batchLinks: any[] = [];
        const qualityHeaders = doc.querySelectorAll(".download-links-div h4");
        
        qualityHeaders.forEach((h4) => {
            const rawText = h4.textContent || "";
            const linkDiv = h4.nextElementSibling;
            
            if (linkDiv && linkDiv.classList.contains("downloads-btns-div")) {
                const resMatch = rawText.match(/(\d{3,4}p)/);
                const res = resMatch ? resMatch[0] : "HD";
                const isHEVC = rawText.toLowerCase().includes("hevc");

                const normalBtn = linkDiv.querySelector("a.btn:not(.btn-zip)");
                if (normalBtn) {
                     const sizeMatch = rawText.match(/\[(\d+(\.\d+)?[GM]B)(\/E)?\]/);
                     const size = sizeMatch ? sizeMatch[1] : "N/A";
                     episodeLinks.push({ label: rawText, res, size, url: normalBtn.getAttribute("href"), isHEVC });
                }

                const zipBtn = linkDiv.querySelector("a.btn-zip");
                if (zipBtn) {
                    const btnText = zipBtn.textContent || "";
                    const sizeMatch = btnText.match(/\[(\d+(\.\d+)?[GM]B)\]/);
                    const size = sizeMatch ? sizeMatch[1] : "Zip";
                    batchLinks.push({ label: rawText.replace("Episode", "Complete Season"), res, size, url: zipBtn.getAttribute("href"), isHEVC });
                }
            }
        });

        const isSeries = batchLinks.length > 0 || title.includes("Season");
        setData({ title, poster, description, episodeLinks, batchLinks, isSeries });
        setLoading(false);

      } catch (e: any) {
        console.error(e);
        setError(e.message);
        setLoading(false);
      }
    };

    init();
  }, [params.slug]);

  const onMainDownloadClick = () => {
      if (data?.isSeries) {
          setView("mode_select");
      } else {
          setDownloadMode("episode");
          setView("quality_select");
      }
  };

  const selectMode = (mode: "episode" | "batch") => {
      setDownloadMode(mode);
      setView("quality_select");
  };

  const proceedToLink = (item: any) => {
    const keyPayload = JSON.stringify({ link: item.url, tmdb: "custom" });
    const key = encodeBase64(keyPayload);
    const quality = encodeURIComponent(item.label);
    
    if (downloadMode === 'episode' && data.isSeries) {
        router.push(`/episodes?key=${key}&quality=${quality}`);
    } else {
        router.push(`/vlyxdrive?key=${key}&action=download&quality=${quality}`);
    }
  };

  // --- UI RENDER ---

  if (loading) return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="relative w-24 h-36 rounded-lg overflow-hidden animate-pulse bg-gray-800">
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-800 to-gray-700"></div>
          </div>
      </div>
  );

  if (error) return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-500/10 p-4 rounded-full mb-4">
              <AlertCircle size={40} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Content Unavailable</h2>
          <p className="text-gray-400 mb-6 max-w-xs">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white text-black font-bold rounded-full">Refresh Page</button>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-red-600/30 overflow-x-hidden">
      
      {/* 1. HERO BACKGROUND (Premium Blur) */}
      <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent z-10"></div>
          <img src={data?.poster} className="w-full h-full object-cover opacity-30 blur-2xl scale-110" alt="Background" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-12">
        
        {/* === VIEW 1: DETAILS === */}
        {view === "info" && (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                {/* Navbar Placeholder */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-300 hover:text-white transition group">
                        <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 backdrop-blur-md">
                            <ChevronLeft size={20} />
                        </div>
                    </button>
                    <div className="text-red-600 font-black tracking-tighter text-xl">NETVLYX</div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
                    {/* Poster Card */}
                    <div className="w-full md:w-[300px] shrink-0 mx-auto">
                        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_0_40px_-10px_rgba(255,255,255,0.1)] border border-white/10 group">
                            <img src={data?.poster} className="w-full h-full object-cover" alt={data?.title} />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                        </div>
                    </div>

                    {/* Content Info */}
                    <div className="flex-1 text-center md:text-left space-y-6">
                        <div>
                             <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-4 drop-shadow-lg">
                                {data?.title}
                             </h1>
                             
                             {/* Meta Badges */}
                             <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-medium text-gray-300">
                                 <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-md backdrop-blur-md border border-white/5">
                                     <Star size={14} className="text-yellow-400" fill="currentColor" /> 9.8
                                 </span>
                                 <span className="bg-white/10 px-3 py-1 rounded-md backdrop-blur-md border border-white/5">
                                     2025
                                 </span>
                                 <span className="bg-red-600/20 text-red-400 border border-red-600/30 px-3 py-1 rounded-md uppercase tracking-wider text-xs font-bold">
                                     {data?.isSeries ? "Series" : "Movie"}
                                 </span>
                                 <span className="bg-white/10 px-3 py-1 rounded-md backdrop-blur-md border border-white/5 flex items-center gap-1.5">
                                     <Clock size={14} /> 2h 45m
                                 </span>
                             </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-400 text-lg leading-relaxed line-clamp-4 md:line-clamp-none max-w-3xl">
                            {data?.description}
                        </p>

                        {/* Main Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start">
                            <button 
                                onClick={onMainDownloadClick}
                                className="bg-white text-black px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]"
                            >
                                <Download size={24} fill="currentColor" />
                                <span>Download</span>
                            </button>
                            
                            <button className="bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/20 transition-colors backdrop-blur-md">
                                <Play size={24} fill="currentColor" />
                                <span>Trailer</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* === VIEW 2: MODE SELECTION (SERIES) === */}
        {view === "mode_select" && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in-95 duration-500">
                <div className="w-full max-w-md">
                    <button onClick={() => setView("info")} className="mb-6 text-gray-400 flex items-center gap-2 hover:text-white transition">
                        <ChevronLeft /> Back
                    </button>
                    
                    <h2 className="text-3xl font-bold text-white mb-2">Download Type</h2>
                    <p className="text-gray-500 mb-8">Choose your preferred download method</p>

                    <div className="grid gap-4">
                        <button 
                            onClick={() => selectMode("episode")} 
                            className="bg-gray-900/60 border border-gray-700 hover:border-green-500 hover:bg-gray-900 p-5 rounded-2xl flex items-center gap-5 transition-all group backdrop-blur-md"
                        >
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                                <PlayCircle size={24} fill="currentColor" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-lg text-white">Episode-wise</h3>
                                <p className="text-sm text-gray-500">Download single episodes</p>
                            </div>
                        </button>

                        <button 
                            onClick={() => selectMode("batch")} 
                            className="bg-gray-900/60 border border-gray-700 hover:border-purple-500 hover:bg-gray-900 p-5 rounded-2xl flex items-center gap-5 transition-all group backdrop-blur-md"
                        >
                            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                <PackageCheck size={24} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-lg text-white">Bulk Download</h3>
                                <p className="text-sm text-gray-500">Full season zip file</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* === VIEW 3: QUALITY LIST === */}
        {view === "quality_select" && (
            <div className="flex flex-col items-center min-h-[60vh] animate-in slide-in-from-right-10 duration-500 pt-10">
                <div className="w-full max-w-lg">
                    <button 
                        onClick={() => data.isSeries ? setView("mode_select") : setView("info")} 
                        className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition"
                    >
                        <ChevronLeft /> Back
                    </button>

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white">Select Quality</h2>
                        <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-gray-400 border border-white/5">
                            {downloadMode === 'batch' ? 'ZIP File' : 'MKV File'}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {(downloadMode === "episode" ? data.episodeLinks : data.batchLinks).map((item: any, i: number) => (
                            <button
                                key={i}
                                onClick={() => proceedToLink(item)}
                                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 p-4 rounded-xl flex items-center justify-between group transition-all backdrop-blur-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
                                        {downloadMode === 'batch' ? <PackageCheck size={20} /> : <Download size={20} />}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-white text-lg flex items-center gap-2">
                                            {item.res} 
                                            {item.isHEVC && <span className="text-[10px] bg-gradient-to-r from-red-600 to-orange-600 px-1.5 py-0.5 rounded text-white shadow-lg">HEVC</span>}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {downloadMode === 'episode' ? "High Speed Server" : "Complete Season"}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-gray-400 bg-black/40 px-2 py-1 rounded border border-white/5">
                                        {item.size}
                                    </span>
                                    <ChevronLeft className="rotate-180 text-gray-600 group-hover:text-white transition-colors" size={20} />
                                </div>
                            </button>
                        ))}

                        {(downloadMode === "episode" ? data.episodeLinks : data.batchLinks).length === 0 && (
                            <div className="p-8 text-center bg-white/5 rounded-xl border border-dashed border-gray-700">
                                <p className="text-gray-400">No links found for this category.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}
