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
  Tv
} from "lucide-react";

export default function MoviePage() {
  const params = useParams();
  const router = useRouter();
  
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  
  // UI View States: 'info' -> 'mode_select' (if series) -> 'quality_select'
  const [view, setView] = useState<"info" | "mode_select" | "quality_select">("info");
  
  // Download Mode: 'episode' (Single Links) or 'batch' (Zip Files)
  const [downloadMode, setDownloadMode] = useState<"episode" | "batch">("episode");

  // --- 1. FETCH & SCRAPE DATA ---
  useEffect(() => {
    const init = async () => {
      try {
        if (!params.slug) return;
        
        // Safe Decoding Logic
        const slugStr = Array.isArray(params.slug) ? params.slug[0] : params.slug;
        const cleanSlug = decodeURIComponent(slugStr);
        const decoded = decodeBase64(cleanSlug);
        
        if (!decoded.includes("|||")) throw new Error("Invalid Link Format");

        const [slug, baseUrl] = decoded.split("|||");
        const targetUrl = `${baseUrl}/${slug}/`;

        console.log("Scraping URL:", targetUrl);

        const html = await fetchProxy(targetUrl);
        if (!html) throw new Error("Failed to load content from source");
        
        const doc = parseHTML(html);

        // A. Basic Details
        const title = doc.querySelector("h1")?.textContent?.trim() || "Unknown Title";
        const poster = doc.querySelector(".post-thumbnail img")?.getAttribute("src") || "";
        const description = doc.querySelector("h3 + p")?.textContent?.trim() || "No description available.";
        
        // B. Advanced Link Extraction
        const episodeLinks: any[] = [];
        const batchLinks: any[] = [];

        const qualityHeaders = doc.querySelectorAll(".download-links-div h4");
        
        qualityHeaders.forEach((h4) => {
            const rawText = h4.textContent || "";
            const linkDiv = h4.nextElementSibling;
            
            if (linkDiv && linkDiv.classList.contains("downloads-btns-div")) {
                
                // Parse Tech Specs
                const resMatch = rawText.match(/(\d{3,4}p)/);
                const res = resMatch ? resMatch[0] : "HD";
                const isHEVC = rawText.toLowerCase().includes("hevc");

                // 1. Find Normal Links (Episode Wise / Single Movie)
                // Logic: <a> tag jisme 'btn-zip' class NAHI hai
                const normalBtn = linkDiv.querySelector("a.btn:not(.btn-zip)");
                if (normalBtn) {
                     // Extract Size (e.g., [180MB/E] or [1.2GB])
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

                // 2. Find Batch/Zip Links
                // Logic: <a> tag jisme 'btn-zip' class HAI
                const zipBtn = linkDiv.querySelector("a.btn-zip");
                if (zipBtn) {
                    const btnText = zipBtn.textContent || "";
                    const sizeMatch = btnText.match(/\[(\d+(\.\d+)?[GM]B)\]/);
                    const size = sizeMatch ? sizeMatch[1] : "Zip";

                    batchLinks.push({
                        label: rawText.replace("Episode", "Complete Season"),
                        res,
                        size,
                        url: zipBtn.getAttribute("href"),
                        isHEVC
                    });
                }
            }
        });

        // Detect if content is a Series
        // Agar batch links mile, ya title me "Season" likha hai to Series hai
        const isSeries = batchLinks.length > 0 || title.includes("Season");

        setData({ title, poster, description, episodeLinks, batchLinks, isSeries });
        setLoading(false);

      } catch (e: any) {
        console.error(e);
        setError(e.message || "Connection Error");
        setLoading(false);
      }
    };

    init();
  }, [params.slug]);


  // --- 2. HANDLERS ---

  // Initial "Download" button click
  const onMainDownloadClick = () => {
      if (data?.isSeries) {
          setView("mode_select"); // Series hai to Mode pucho
      } else {
          setDownloadMode("episode"); // Movie hai to direct quality dikhao
          setView("quality_select");
      }
  };

  // Series Mode Select (Episode vs Batch)
  const selectMode = (mode: "episode" | "batch") => {
      setDownloadMode(mode);
      setView("quality_select");
  };

  // Final Action: Proceed to Parsing Pages
  const proceedToLink = (item: any) => {
    const keyPayload = JSON.stringify({
        link: item.url,
        tmdb: "custom"
    });
    const key = encodeBase64(keyPayload);
    const quality = encodeURIComponent(item.label);
    
    if (downloadMode === 'episode' && data.isSeries) {
        // 🔥 CRITICAL UPDATE:
        // Agar Series ka Episode mode hai, to /episodes page par bhejo
        // Kyunki wahan episodes ki list (1, 2, 3...) scrape hogi
        router.push(`/episodes?key=${key}&quality=${quality}`);
    } else {
        // Agar Movie hai YA Series ka Zip file hai
        // To seedha Downloading system (VlyxDrive) par bhejo
        router.push(`/vlyxdrive?key=${key}&action=download&quality=${quality}`);
    }
  };


  // --- 3. RENDERERS (LOADING / ERROR) ---

  if (loading) return (
      <div className="min-h-screen bg-black p-6 flex flex-col items-center pt-24 space-y-6">
          <div className="w-48 h-72 bg-gray-800 rounded-xl animate-pulse shadow-2xl"></div>
          <div className="h-8 w-3/4 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-20 w-full max-w-lg bg-gray-800 rounded animate-pulse"></div>
      </div>
  );

  if (error) return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-4">
          <AlertCircle size={50} className="text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-white">Oops! Connection Failed</h2>
          <p className="text-gray-400 mt-2 max-w-md">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white font-semibold transition">
            Try Again
          </button>
      </div>
  );


  // --- 4. MAIN UI ---

  return (
    <div className="min-h-screen bg-black pb-20 text-white font-sans selection:bg-red-500/30">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <img src={data?.poster} className="w-full h-full object-cover opacity-[0.15] blur-3xl scale-110" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pt-6 md:pt-10">
        
        {/* =================================
           VIEW 1: MOVIE / SERIES INFO
           ================================= */}
        {view === "info" && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Back Button */}
                <button onClick={() => router.push('/')} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition group">
                    <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="font-medium">Back to Home</span>
                </button>

                <div className="flex flex-col md:flex-row gap-10 items-center md:items-start max-w-5xl mx-auto">
                    {/* Poster */}
                    <div className="shrink-0 relative group">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-red-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <img 
                            src={data?.poster} 
                            className="relative w-72 md:w-80 rounded-2xl shadow-2xl border border-white/10" 
                            alt={data?.title} 
                        />
                    </div>

                    {/* Details */}
                    <div className="space-y-6 text-center md:text-left w-full">
                        <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
                            {data?.title}
                        </h1>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <span className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 text-gray-300">
                                <Calendar size={14} className="text-red-500"/> 2025
                            </span>
                            <span className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 text-gray-300">
                                {data?.isSeries ? <Tv size={14} className="text-purple-500"/> : <Film size={14} className="text-blue-500"/>}
                                {data?.isSeries ? "Web Series" : "Movie"}
                            </span>
                        </div>

                        <p className="text-gray-400 leading-relaxed text-base md:text-lg line-clamp-5 max-w-3xl mx-auto md:mx-0">
                            {data?.description}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center md:justify-start">
                             <button 
                                onClick={onMainDownloadClick} 
                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-red-900/40 active:scale-95"
                             >
                                <Download size={22} />
                                {data?.isSeries ? "Download Options" : "Download Movie"}
                             </button>
                             
                             <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all backdrop-blur-md">
                                <Play size={22} fill="currentColor" /> Watch Trailer
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* =================================
           VIEW 2: MODE SELECTION (SERIES)
           ================================= */}
        {view === "mode_select" && (
            <div className="max-w-md mx-auto animate-in zoom-in-95 duration-500 pt-10">
                <button onClick={() => setView("info")} className="mb-8 text-gray-400 flex items-center gap-2 hover:text-white transition">
                    <ChevronLeft /> Back to details
                </button>
                
                <h2 className="text-3xl font-bold text-center mb-2">Choose Type</h2>
                <p className="text-center text-gray-500 mb-10">How would you like to download?</p>

                <div className="space-y-4">
                    <button 
                        onClick={() => selectMode("episode")} 
                        className="w-full bg-slate-900/50 border border-slate-700 hover:border-green-500/50 hover:bg-slate-800 p-6 rounded-2xl flex items-center gap-6 transition-all group"
                    >
                        <div className="p-4 bg-green-500/10 rounded-full text-green-500 group-hover:scale-110 transition-transform">
                            <PlayCircle size={32} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-xl text-white group-hover:text-green-400 transition-colors">Episode-wise</h3>
                            <p className="text-sm text-gray-500">Download individual episodes</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => selectMode("batch")} 
                        className="w-full bg-slate-900/50 border border-slate-700 hover:border-purple-500/50 hover:bg-slate-800 p-6 rounded-2xl flex items-center gap-6 transition-all group"
                    >
                        <div className="p-4 bg-purple-500/10 rounded-full text-purple-500 group-hover:scale-110 transition-transform">
                            <PackageCheck size={32} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-xl text-white group-hover:text-purple-400 transition-colors">Bulk Download</h3>
                            <p className="text-sm text-gray-500">Download complete season (Zip)</p>
                        </div>
                    </button>
                </div>
            </div>
        )}

        {/* =================================
           VIEW 3: QUALITY SELECTION
           ================================= */}
        {view === "quality_select" && (
            <div className="max-w-lg mx-auto animate-in slide-in-from-right-8 duration-500 pt-10">
                <button 
                    onClick={() => data.isSeries ? setView("mode_select") : setView("info")} 
                    className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition"
                >
                    <ChevronLeft /> Back
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white">Select Quality</h2>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 border ${downloadMode === 'batch' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                        {downloadMode === 'batch' ? 'ZIP / Batch Files' : 'Single Video Files'}
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Filter and Map Links */}
                    {(downloadMode === "episode" ? data.episodeLinks : data.batchLinks).map((item: any, i: number) => (
                        <button
                            key={i}
                            onClick={() => proceedToLink(item)}
                            className="w-full bg-gray-900/80 border border-gray-800 hover:border-gray-600 p-4 rounded-xl flex items-center justify-between group transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${downloadMode === 'batch' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {downloadMode === 'batch' ? <PackageCheck size={20} /> : <Download size={20} />}
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-white text-lg flex items-center gap-2">
                                        {item.res} 
                                        {item.isHEVC && <span className="text-[10px] bg-red-600 px-1.5 py-0.5 rounded text-white tracking-wider">HEVC</span>}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate max-w-[180px]">
                                        {downloadMode === 'episode' ? "High Speed Server" : "Contains all episodes"}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-mono group-hover:bg-gray-700 transition-colors border border-gray-700">
                                {item.size}
                            </div>
                        </button>
                    ))}

                    {/* Empty State */}
                    {(downloadMode === "episode" ? data.episodeLinks : data.batchLinks).length === 0 && (
                        <div className="text-center p-10 bg-gray-900/50 rounded-2xl border border-gray-800 border-dashed">
                            <p className="text-gray-400">No links found for this mode.</p>
                            <button onClick={() => setView("mode_select")} className="text-blue-400 text-sm mt-2 hover:underline">
                                Try changing download type
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
            }
