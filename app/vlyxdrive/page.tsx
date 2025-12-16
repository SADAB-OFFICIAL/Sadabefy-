"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchProxy, decodeBase64, parseHTML, encodeBase64 } from "@/lib/utils";
import { CloudLightning, Cloud, ShieldCheck } from "lucide-react";

// 1. Logic ko alag component bana diya
function VlyxDriveContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Establishing secure connection...");
  const [servers, setServers] = useState<any[]>([]);

  useEffect(() => {
    const process = async () => {
      const key = params.get("key");
      const qualityRaw = params.get("quality") || "";
      if (!key) return;

      try {
          const { link } = JSON.parse(decodeBase64(key));
          
          setStatus("Scanning for fastest servers...");
          const html = await fetchProxy(link);
          if (!html) throw new Error("Source unreachable");

          const doc = parseHTML(html);
          
          // Match Quality Header
          const searchTerms = decodeURIComponent(qualityRaw).split(" ").filter(s => s.length > 2);
          const headers = doc.querySelectorAll(".download-links-div h4");
          
          let targetDiv: Element | null = null;

          headers.forEach(h4 => {
             const text = h4.textContent || "";
             if (searchTerms.some(term => text.includes(term))) {
                 targetDiv = h4.nextElementSibling;
             }
          });

          // Extract Server Links
          const found: any[] = [];
          if (targetDiv) {
             const links = (targetDiv as Element).querySelectorAll("a");
             links.forEach(a => {
                 const href = a.getAttribute("href");
                 if (!href) return;

                 if (href.includes("hubcloud")) {
                     found.push({ name: "N-Cloud", type: "ncloud", url: href });
                 } else if (href.includes("gdflix") || href.includes("skymovies")) {
                     found.push({ name: "V-Cloud", type: "vcloud", url: href });
                 } else if (href.includes("drive.google")) {
                     found.push({ name: "G-Drive", type: "gdrive", url: href });
                 }
             });
          }

          setServers(found);
          setStatus("");

      } catch (error) {
          setStatus("Error resolving links. Please try again.");
      }
    };

    process();
  }, [params]);

  const handleNext = (server: any) => {
      if (server.type === "ncloud") {
          const payload = encodeBase64(JSON.stringify({ url: server.url, title: "Download" }));
          router.push(`/ncloud?key=${payload}&action=download`);
      } else {
          window.open(server.url, "_blank");
      }
  };

  if (servers.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 animate-pulse">{status}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
       <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
           <div className="text-center mb-8">
               <div className="inline-block p-3 rounded-full bg-green-500/10 text-green-500 mb-4">
                   <ShieldCheck size={32} />
               </div>
               <h2 className="text-2xl font-bold text-white">Select Server</h2>
               <p className="text-gray-500 text-sm mt-1">High speed secure servers found</p>
           </div>

           <div className="space-y-4">
               {servers.map((srv, i) => (
                   <button
                      key={i}
                      onClick={() => handleNext(srv)}
                      className={`w-full p-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95
                      ${srv.type === 'ncloud' 
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg shadow-orange-500/20' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20'}`}
                   >
                       {srv.type === 'ncloud' ? <CloudLightning /> : <Cloud />}
                       Continue with {srv.name}
                   </button>
               ))}
           </div>

           <div className="mt-8 pt-6 border-t border-gray-800 text-center">
               <p className="text-xs text-gray-600">
                   Protected by VlyxGuard • SSL Encryption
               </p>
           </div>
       </div>
    </div>
  );
}

// 2. Default Export mein Suspense Laga Diya
export default function VlyxDrive() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Drive...</div>}>
      <VlyxDriveContent />
    </Suspense>
  );
}
