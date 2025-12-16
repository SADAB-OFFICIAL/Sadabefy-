"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchProxy, decodeBase64, parseHTML, encodeBase64 } from "@/lib/utils";
import { CloudLightning, ChevronLeft, Calendar, AlertCircle } from "lucide-react";

function EpisodesContent() {
  const params = useSearchParams();
  const router = useRouter();
  
  // --- STATE ---
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Season Episodes");
  const [qualityLabel, setQualityLabel] = useState(""); // ✅ Yeh State Zaroori Hai

  useEffect(() => {
    const fetchEpisodes = async () => {
      const key = params.get("key");
      const quality = params.get("quality") || "";
      
      // ✅ Local 'quality' variable ko State mein save kar rahe hain
      setQualityLabel(decodeURIComponent(quality));

      if (!key) return;

      try {
        const decoded = JSON.parse(decodeBase64(key));
        const link = decoded.link; 
        
        const html = await fetchProxy(link);
        if (!html) throw new Error("Failed to fetch episodes");

        const doc = parseHTML(html);
        
        // Page Title Cleaning
        const pageTitle = doc.querySelector("h1")?.textContent?.replace("Always Use Official Website", "").trim();
        if(pageTitle) setTitle(pageTitle);

        // Episode List Extraction
        const episodeList: any[] = [];
        const headers = doc.querySelectorAll(".download-links-div h5");

        headers.forEach((h5) => {
            const epText = h5.textContent || "";
            const epNum = epText.match(/\d+/)?.[0] || "?";
            
            const btnDiv = h5.nextElementSibling;
            if (btnDiv && btnDiv.classList.contains("downloads-btns-div")) {
                const anchors = btnDiv.querySelectorAll("a");
                const links: any[] = [];

                anchors.forEach(a => {
                    const href = a.getAttribute("href");
                    if (href?.includes("hubcloud")) {
                        links.push({ name: "Hub-Cloud", url: href });
                    }
                });

                if (links.length > 0) {
                    episodeList.push({
                        epNum,
                        title: `Episode ${epNum}`,
                        links
                    });
                }
            }
        });

        setEpisodes(episodeList);
        setLoading(false);

      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, [params]);

  const handleEpisodeClick = (url: string) => {
      const payload = encodeBase64(JSON.stringify({ url, title: "Download Episode" }));
      router.push(`/ncloud?key=${payload}&action=download`);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
       
       {/* Header */}
       <div className="max-w-2xl mx-auto pt-6 mb-8">
           <button onClick={() => router.back()} className="text-gray-400 flex items-center gap-2 mb-4 hover:text-white transition">
               <ChevronLeft /> Back
           </button>
           <h1 className="text-xl md:text-2xl font-bold leading-tight">{title}</h1>
           
           {/* ✅ FIXED: Yahan 'quality' ki jagah 'qualityLabel' use kiya hai */}
           <p className="text-gray-500 text-sm mt-1">{qualityLabel || "High Quality"}</p>
       </div>

       {/* Episodes Grid */}
       <div className="max-w-2xl mx-auto space-y-4">
           {loading ? (
               [1,2,3,4].map(i => (
                   <div key={i} className="h-32 bg-gray-900 rounded-2xl animate-pulse border border-gray-800"></div>
               ))
           ) : episodes.length === 0 ? (
               <div className="text-center py-10 bg-gray-900 rounded-xl border border-red-900/30">
                   <AlertCircle className="mx-auto text-red-500 mb-2" />
                   <p className="text-gray-400">No episodes found. Try a different quality.</p>
               </div>
           ) : (
               episodes.map((ep, i) => (
                   <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 hover:border-gray-700 transition-colors">
                       
                       <div className="relative w-full sm:w-32 h-20 bg-gray-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-white/5">
                           <div className="text-2xl font-black text-gray-700 select-none">
                               {ep.epNum}
                           </div>
                       </div>

                       <div className="flex-1">
                           <div className="flex justify-between items-start mb-3">
                               <div>
                                   <h3 className="font-bold text-white text-lg">Episode {ep.epNum}</h3>
                                   <p className="text-gray-500 text-xs flex items-center gap-1">
                                       <Calendar size={10} /> Season 1
                                   </p>
                               </div>
                           </div>

                           <div className="grid gap-2">
                               {ep.links.map((link: any, idx: number) => (
                                   <button 
                                        key={idx}
                                        onClick={() => handleEpisodeClick(link.url)}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-700"
                                   >
                                       <CloudLightning size={16} className="text-yellow-500" />
                                       <span>Download Episode</span>
                                   </button>
                               ))}
                           </div>
                       </div>
                   </div>
               ))
           )}
       </div>
    </div>
  );
}

export default function Episodes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-gray-500">Loading Episodes...</div>}>
      <EpisodesContent />
    </Suspense>
  );
            }
