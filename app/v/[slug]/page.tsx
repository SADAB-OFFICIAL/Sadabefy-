"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchProxy, decodeBase64, parseHTML, encodeBase64 } from "@/lib/utils";
import { Download, Play, ChevronLeft, Calendar, Film, AlertCircle } from "lucide-react";

export default function MoviePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [showQualities, setShowQualities] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (!params.slug) return;
        
        // Safe Decoding
        const slugStr = Array.isArray(params.slug) ? params.slug[0] : params.slug;
        // Fix for URL encoded chars in Base64
        const cleanSlug = decodeURIComponent(slugStr);
        const decoded = decodeBase64(cleanSlug);
        
        if (!decoded.includes("|||")) {
            throw new Error("Invalid URL Format");
        }

        const [slug, baseUrl] = decoded.split("|||");
        const targetUrl = `${baseUrl}/${slug}/`;
        
        console.log("Fetching:", targetUrl); // Debugging

        const html = await fetchProxy(targetUrl);
        if (!html) throw new Error("Failed to fetch movie data");
        
        const doc = parseHTML(html);

        // --- Scraping Logic ---
        const title = doc.querySelector("h1")?.textContent?.trim() || "Unknown Title";
        const poster = doc.querySelector(".post-thumbnail img")?.getAttribute("src") || "";
        const description = doc.querySelector("h3 + p")?.textContent?.trim();

        // Extract Links
        const downloads: any[] = [];
        const qualityHeaders = doc.querySelectorAll(".download-links-div h4");
        
        qualityHeaders.forEach((h4) => {
            const rawText = h4.textContent || "";
            const linkDiv = h4.nextElementSibling;
            
            if (linkDiv && linkDiv.classList.contains("downloads-btns-div")) {
                const linkTag = linkDiv.querySelector("a");
                if (linkTag) {
                    const resMatch = rawText.match(/(\d{3,4}p)/);
                    const sizeMatch = rawText.match(/\[(\d+(\.\d+)?[GM]B)\]/);
                    
                    downloads.push({
                        label: rawText,
                        res: resMatch ? resMatch[0] : "HD",
                        size: sizeMatch ? sizeMatch[1] : "N/A",
                        url: linkTag.getAttribute("href"),
                        isHEVC: rawText.toLowerCase().includes("hevc")
                    });
                }
            }
        });

        // ✅ FIXED: Using 'downloads' key consistently
        setData({ title, poster, description, downloads });
        setLoading(false);

      } catch (e: any) {
        console.error(e);
        setError(e.message || "Something went wrong");
        setLoading(false);
      }
    };

    init();
  }, [params.slug]);

  const handleDownload = (item: any) => {
    const keyPayload = JSON.stringify({
        link: item.url,
        tmdb: "custom"
    });
    const key = encodeBase64(keyPayload);
    const quality = encodeURIComponent(item.label);
    
    router.push(`/vlyxdrive?key=${key}&action=download&quality=${quality}`);
  };

  if (loading) return (
      <div className="min-h-screen bg-black p-6 space-y-6 flex flex-col items-center pt-20">
          <div className="w-40 h-60 bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-8 w-3/4 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-4 w-1/2 bg-gray-800 rounded animate-pulse"></div>
      </div>
  );

  if (error) return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-500 p-4 text-center">
          <AlertCircle size={48} className="mb-4" />
          <h2 className="text-xl font-bold">Error Loading Movie</h2>
          <p className="text-gray-400 mt-2">{error}</p>
          <button onClick={() => router.push('/')} className="mt-6 bg-white text-black px-6 py-2 rounded-full font-bold">
            Go Home
          </button>
      </div>
  );

  return (
    <div className="min-h-screen bg-black pb-20 text-white">
      
      {!showQualities ? (
          // --- VIEW 1: MOVIE INFO ---
          <>
            {/* Backdrop Blur */}
            <div className="absolute top-0 left-0 w-full h-[50vh] overflow-hidden z-0">
                <img src={data?.poster} className="w-full h-full object-cover opacity-20 blur-3xl" alt="Backdrop" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 pt-10">
                <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-gray-300 hover:text-white transition">
                    <ChevronLeft /> Back
                </button>

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    <div className="shrink-0">
                        <img src={data?.poster} className="w-64 rounded-xl shadow-2xl shadow-red-900/20 border border-white/10" alt={data?.title} />
                    </div>

                    <div className="space-y-6 text-center md:text-left w-full">
                        <h1 className="text-3xl md:text-5xl font-bold leading-tight">{data?.title}</h1>
                        
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-gray-400">
                            <span className="bg-white/10 px-3 py-1 rounded-full flex items-center gap-1"><Calendar size={14}/> 2025</span>
                            <span className="bg-white/10 px-3 py-1 rounded-full flex items-center gap-1"><Film size={14}/> Action</span>
                        </div>

                        <p className="text-gray-300 leading-relaxed text-sm md:text-base line-clamp-4 max-w-2xl">
                            {data?.description || "No plot available for this movie."}
                        </p>

                        <div className="flex flex-col gap-3 pt-4 max-w-md mx-auto md:mx-0">
                             <button 
                                onClick={() => setShowQualities(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                             >
                                <Download size={24} /> Download Movie
                             </button>
                        </div>
                    </div>
                </div>
            </div>
          </>
      ) : (
          // --- VIEW 2: QUALITY SELECTION ---
          <div className="container mx-auto px-4 pt-10 max-w-lg relative z-20">
             <button onClick={() => setShowQualities(false)} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition">
                <ChevronLeft /> Back to Movie
             </button>

             <h2 className="text-2xl font-bold text-white mb-6 text-center">Select Quality</h2>

             <div className="space-y-3 animate-in slide-in-from-bottom-10 duration-500">
                 {/* ✅ FIXED: Accessing data.downloads correctly */}
                 {data?.downloads?.map((item: any, i: number) => (
                     <button
                        key={i}
                        onClick={() => handleDownload(item)}
                        className="w-full bg-gray-900 border border-gray-800 hover:border-blue-500 hover:bg-gray-800 p-4 rounded-xl flex items-center justify-between group transition-all active:scale-95"
                     >
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-500/10 text-blue-400 p-3 rounded-full">
                                <Download size={20} />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-white text-lg flex items-center gap-2">
                                    {item.res} 
                                    {item.isHEVC && <span className="text-[10px] bg-purple-600 px-1.5 py-0.5 rounded text-white">HEVC</span>}
                                </div>
                                <div className="text-xs text-gray-500 truncate max-w-[150px]">{item.label}</div>
                            </div>
                        </div>
                        <div className="bg-gray-800 text-gray-300 px-3 py-1 rounded-lg text-xs font-mono group-hover:bg-gray-700 border border-gray-700">
                            {item.size}
                        </div>
                     </button>
                 ))}
                 
                 {data?.downloads?.length === 0 && (
                     <p className="text-center text-gray-500">No download links found.</p>
                 )}
             </div>
          </div>
      )}
    </div>
  );
}
