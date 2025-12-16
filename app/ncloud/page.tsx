"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchProxy, decodeBase64, parseHTML } from "@/lib/utils";
import { Download, Bug, CheckCircle2, ChevronLeft, AlertTriangle } from "lucide-react";

function NCloudContent() {
  const params = useSearchParams();
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stepMsg, setStepMsg] = useState("Connecting to cloud storage...");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const doubleHop = async () => {
      const key = params.get("key");
      if (!key) return;

      try {
        const decoded = JSON.parse(decodeBase64(key));
        const hubCloudUrl = decoded.url;
        console.log("Step 1: HubCloud URL:", hubCloudUrl);

        // --- HOP 1: HubCloud ---
        setStepMsg("Bypassing HubCloud security...");
        const html1 = await fetchProxy(hubCloudUrl);
        if (!html1) throw new Error("HubCloud timeout - Proxy failed");
        
        const doc1 = parseHTML(html1);
        
        // Strategy A: Find by ID
        let gamerLink = doc1.querySelector("a#download")?.getAttribute("href");

        // Strategy B: Find by Class & Text (Fallback)
        if (!gamerLink) {
            const allLinks = doc1.querySelectorAll("a.btn");
            allLinks.forEach(a => {
                if (a.textContent?.includes("Generate Direct Download Link")) {
                    gamerLink = a.getAttribute("href");
                }
            });
        }

        if (!gamerLink) {
            console.error("HubCloud HTML Dump:", html1.substring(0, 500)); // Log HTML for debugging
            throw new Error("Direct link not found in HubCloud page");
        }
        
        console.log("Step 2: Gamer Link Found:", gamerLink);

        // --- HOP 2: GamerXYT ---
        setStepMsg("Resolving final file servers...");
        const html2 = await fetchProxy(gamerLink);
        if (!html2) throw new Error("GamerXYT timeout - Proxy failed");
        
        const doc2 = parseHTML(html2);
        const finalLinks: any[] = [];
        const anchors = doc2.querySelectorAll("a.btn"); // Target button class

        anchors.forEach((a) => {
            const txt = a.textContent?.toLowerCase() || "";
            const href = a.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("javascript")) return;

            // Debugging extracted links
            // console.log("Found Link:", txt, href);

            if (txt.includes("fslv2")) {
                finalLinks.push({ name: "FSLv2 Server", url: href, bg: "bg-blue-500/10", border: "border-blue-500/50", iconBg: "bg-blue-500/20", iconColor: "text-blue-400" });
            } else if (txt.includes("fsl") && !txt.includes("v2")) {
                finalLinks.push({ name: "FSL Server", url: href, bg: "bg-indigo-500/10", border: "border-indigo-500/50", iconBg: "bg-indigo-500/20", iconColor: "text-indigo-400" });
            } else if (txt.includes("pixel") || href.includes("pixeldrain")) {
                finalLinks.push({ name: "PixelServer : 2", url: href, bg: "bg-purple-500/10", border: "border-purple-500/50", iconBg: "bg-purple-500/20", iconColor: "text-purple-400" });
            } else if (txt.includes("zipdisk")) {
                finalLinks.push({ name: "ZipDisk Server", url: href, bg: "bg-rose-500/10", border: "border-rose-500/50", iconBg: "bg-rose-500/20", iconColor: "text-rose-400" });
            }
        });

        if (finalLinks.length === 0) {
             throw new Error("No valid server links found on final page.");
        }

        setServers(finalLinks);
        setLoading(false);

      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Failed to resolve links");
        setLoading(false);
      }
    };

    doubleHop();
  }, [params]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* Glow Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
            
            {/* Header Area */}
            <div className="text-center mb-8">
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                         <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 animate-pulse">
                             <div className="w-8 h-8 border-2 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                         </div>
                         <p className="text-purple-300 font-mono text-xs tracking-widest uppercase">{stepMsg}</p>
                    </div>
                ) : errorMsg ? (
                     <div className="flex flex-col items-center gap-4 text-red-500">
                        <AlertTriangle size={48} />
                        <p className="text-center font-bold">{errorMsg}</p>
                        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-500/20 rounded-full text-sm hover:bg-red-500/40 transition">Retry</button>
                     </div>
                ) : (
                    <div className="animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-green-500/10 rounded-3xl mx-auto mb-6 flex items-center justify-center border border-green-500/30">
                            <CheckCircle2 className="text-green-500 w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Download Options</h1>
                        <div className="inline-flex items-center gap-2 bg-green-900/20 border border-green-500/30 text-green-400 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Ready to download
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="h-20 w-full bg-gray-900/50 rounded-2xl border border-gray-800 animate-pulse"></div>
                    ))}
                </div>
            ) : !errorMsg && (
                <div className="space-y-4 animate-in slide-in-from-bottom-10 fade-in duration-700">
                    {servers.map((srv, idx) => (
                        <a 
                            key={idx} 
                            href={srv.url}
                            target="_blank"
                            className={`group block w-full p-4 rounded-2xl border ${srv.border} ${srv.bg} backdrop-blur-sm flex justify-between items-center transition-all hover:scale-[1.02] hover:shadow-lg`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${srv.iconBg} ${srv.iconColor}`}>
                                    <Download size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg tracking-tight">{srv.name}</h3>
                                    <p className="text-gray-400 text-xs flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                        Available Server
                                    </p>
                                </div>
                            </div>
                            <div className="text-gray-500 group-hover:translate-x-1 transition-transform">
                                <ChevronLeft className="rotate-180" />
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>

        {/* Floating Bug Report */}
        <button className="fixed bottom-6 right-6 bg-gradient-to-r from-red-600 to-rose-600 p-4 rounded-full shadow-lg shadow-red-900/50 hover:scale-110 transition active:scale-95 group">
            <Bug className="text-white w-6 h-6 group-hover:rotate-12 transition" />
        </button>
    </div>
  );
}

export default function NCloud() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <NCloudContent />
    </Suspense>
  );
}
