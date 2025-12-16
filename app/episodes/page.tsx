"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchProxy, decodeBase64, parseHTML, encodeBase64 } from "@/lib/utils";
import { PlayCircle, CloudLightning, ChevronLeft, Calendar } from "lucide-react";

function EpisodesContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Season Episodes");

  useEffect(() => {
    const fetchEpisodes = async () => {
      const key = params.get("key");
      const quality = params.get("quality") || "";
      if (!key) return;

      try {
        const { link } = JSON.parse(decodeBase64(key)); // m4ulinks URL
        const html = await fetchProxy(link);
        if (!html) throw new Error("Failed to fetch episodes");

        const doc = parseHTML(html);
        
        // Scraping Logic for Episodes
        // Structure: <h5>-:Episodes: 1:-</h5> <div class="downloads-btns-div">...</div>
        const episodeList: any[] = [];
        const headers = doc.querySelectorAll(".download-links-div h5");
        
        // Title nikal lo agar mil jaye
        const pageTitle = doc.querySelector("h1")?.textContent?.replace("Always Use Official Website", "").trim();
        if(pageTitle) setTitle(pageTitle);

        headers.forEach((h5) => {
            const epText = h5.textContent || "";
            // Extract Episode Number: "-:Episodes: 1:-" -> "1"
            const epNum = epText.match(/\d+/)?.[0] || "?";
            
            const btnDiv = h5.nextElementSibling;
            if (btnDiv && btnDiv.classList.contains("downloads-btns-div")) {
                const anchors = btnDiv.querySelectorAll("a");
                const links: any[] = [];

                anchors.forEach(a => {
                    const href = a.getAttribute("href");
                    if (href?.includes("hubcloud")) {
                        links.push({ name: "Hub-Cloud", url: href, type: "ncloud" });
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
      }
    };

    fetchEpisodes();
  }, [params]);

  const handleEpisodeClick = (url: string) => {
      // Send to N-Cloud page
      const payload = encodeBase64(JSON.stringify({ url, title: "Download Episode" }));
      router.push(`/ncloud?key=${payload}&action=download`);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
       
       {/* Header */}
       <div className="max-w-2xl mx-auto pt-6 mb-8">
           <button onClick={() => router.back()} className="text-gray-400 flex items-center gap-2 mb-4 hover:text-white">
               <ChevronLeft /> Back
           </button>
           <h1 className="text-2xl font-bold">{title}</h1>
           <p className="text-gray-500 text-sm mt-1">{quality}</p>
       </div>

       {/* Episodes Grid */}
       <div className="max-w-2xl mx-auto space-y-4">
           {loading ? (
               [1,2,3,4].map(i => (
                   <div key={i} className="h-40 bg-gray-900 rounded-2xl animate-pulse"></div>
               ))
           ) : (
               episodes.map((ep, i) => (
                   <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 md:p-6 flex flex-col gap-4">
                       
                       {/* Episode Info */}
                       <div className="flex gap-4">
                           <div className="relative w-32 h-20 bg-gray-800 rounded-lg overflow-hidden shrink-0">
                               {/* Placeholder Image since we don't have per-episode images */}
                               <div className="absolute inset-0 flex items-center justify-center bg-blue-900/20 text-blue-500 font-bold text-xl">
                                   E{ep.epNum}
                               </div>
                           </div>
                           <div>
                               <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-md font-bold mb-2 inline-block">
                                   Episode {ep.epNum}
                               </span>
                               <h3 className="font-bold text-lg leading-tight">Season 1</h3>
                               <p className="text-gray-500 text-xs mt-1 flex items-center gap-2">
                                   <Calendar size={12} /> {new Date().getFullYear()}
                               </p>
                           </div>
                       </div>

                       {/* Action Button */}
                       {ep.links.map((link: any, idx: number) => (
                           <button 
                                key={idx}
                                onClick={() => handleEpisodeClick(link.url)}
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-orange-500/20"
                           >
                               <CloudLightning size={20} />
                               Get Episode (Cloud)
                           </button>
                       ))}
                       
                       <p className="text-center text-xs text-gray-500">
                           {ep.links.length > 1 ? `+ ${ep.links.length - 1} more servers` : "Fastest Server Selected"}
                       </p>
                   </div>
               ))
           )}
       </div>
    </div>
  );
}

export default function Episodes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">Loading Episodes...</div>}>
      <EpisodesContent />
    </Suspense>
  );
             }
