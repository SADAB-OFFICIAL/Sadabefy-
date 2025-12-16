"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { decodeBase64 } from "@/lib/utils";
import { Download, Bug, CheckCircle2, ChevronLeft, Server, CloudLightning, Zap } from "lucide-react";

// --- CUSTOM API CONFIG ---
const API_BASE = "https://nothing-to-see-nine.vercel.app/hubcloud";
const API_KEY = "sadabefy";

function NCloudContent() {
  const params = useSearchParams();
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [movieTitle, setMovieTitle] = useState("Download Options");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchFromApi = async () => {
      const key = params.get("key");
      if (!key) return;

      try {
        // 1. URL Decode karo
        const decoded = JSON.parse(decodeBase64(key));
        const targetUrl = decoded.url; // HubCloud or GDFlix Link

        console.log("Target URL:", targetUrl);

        // 2. Tumhari Custom API Call karo
        const apiUrl = `${API_BASE}?url=${encodeURIComponent(targetUrl)}&key=${API_KEY}`;
        const res = await fetch(apiUrl);
        
        if (!res.ok) throw new Error("API Server Error");
        
        const data = await res.json();

        // 3. Data Validate karo
        if (!data.streams || data.streams.length === 0) {
            throw new Error("No download links found in API response");
        }

        // Title Set karo (Optional)
        if (data.title) {
            // Title ko thoda clean kar dete hain (dots hata kar)
            setMovieTitle(data.title.replace(/\./g, " "));
        }

        // 4. Servers Map karo (Styling ke saath)
        const mappedServers = data.streams.map((stream: any) => {
            const name = stream.server.toLowerCase();
            let styles = {
                bg: "bg-slate-800/50",
                border: "border-slate-700",
                iconColor: "text-slate-400",
                iconBg: "bg-slate-700/50"
            };

            // Server Name ke hisaab se Colors
            if (name.includes("fsl")) {
                styles = { bg: "bg-blue-900/10", border: "border-blue-500/50", iconColor: "text-blue-400", iconBg: "bg-blue-500/20" };
            } else if (name.includes("10gbps") || name.includes("fast")) {
                styles = { bg: "bg-red-900/10", border: "border-red-500/50", iconColor: "text-red-400", iconBg: "bg-red-500/20" };
            } else if (name.includes("pixel") || name.includes("pixeldrain")) {
                styles = { bg: "bg-purple-900/10", border: "border-purple-500/50", iconColor: "text-purple-400", iconBg: "bg-purple-500/20" };
            } else if (name.includes("cloud") || name.includes("temp")) {
                styles = { bg: "bg-amber-900/10", border: "border-amber-500/50", iconColor: "text-amber-400", iconBg: "bg-amber-500/20" };
            } else if (name.includes("telegram")) {
                styles = { bg: "bg-sky-900/10", border: "border-sky-500/50", iconColor: "text-sky-400", iconBg: "bg-sky-500/20" };
            }

            return {
                name: stream.server,
                url: stream.link,
                type: stream.type || "mkv",
                ...styles
            };
        });

        setServers(mappedServers);
        setLoading(false);

      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Failed to resolve links");
        setLoading(false);
      }
    };

    fetchFromApi();
  }, [params]);

  const handleDownload = (url: string) => {
      // Direct Download Link open karo
      window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* Glow Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-lg relative z-10">
            
            {/* Header Area */}
            <div className="text-center mb-8">
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                         <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 animate-pulse">
                             <div className="w-8 h-8 border-2 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                         </div>
                         <p className="text-purple-300 font-mono text-xs tracking-widest uppercase animate-pulse">Resolving Links...</p>
                    </div>
                ) : errorMsg ? (
                     <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-2xl text-center">
                        <Bug className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h3 className="text-red-400 font-bold mb-2">Link Generation Failed</h3>
                        <p className="text-red-300/70 text-sm mb-4">{errorMsg}</p>
                        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white rounded-full text-sm hover:bg-red-700 transition">Try Again</button>
                     </div>
                ) : (
                    <div className="animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-green-500/10 rounded-3xl mx-auto mb-6 flex items-center justify-center border border-green-500/30 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]">
                            <CheckCircle2 className="text-green-500 w-10 h-10" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2 line-clamp-2">{movieTitle}</h1>
                        <div className="inline-flex items-center gap-2 bg-green-900/20 border border-green-500/30 text-green-400 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide mt-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            {servers.length} Servers Found
                        </div>
                    </div>
                )}
            </div>

            {/* Server List */}
            {!loading && !errorMsg && (
                <div className="space-y-3 animate-in slide-in-from-bottom-10 fade-in duration-700">
                    {servers.map((srv, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => handleDownload(srv.url)}
                            className={`group w-full p-4 rounded-2xl border ${srv.border} ${srv.bg} backdrop-blur-sm flex justify-between items-center transition-all hover:scale-[1.02] hover:shadow-lg hover:brightness-110`}
                        >
                            <div className="flex items-center gap-4 text-left">
                                <div className={`p-3 rounded-xl ${srv.iconBg} ${srv.iconColor} shadow-inner`}>
                                    {srv.name.includes("10Gbps") ? <Zap size={22} /> : 
                                     srv.name.includes("FSL") ? <CloudLightning size={22} /> :
                                     <Server size={22} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-md tracking-tight group-hover:text-primary transition-colors">{srv.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs bg-black/40 px-2 py-0.5 rounded text-gray-400 font-mono border border-white/5">{srv.type.toUpperCase()}</span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Fast
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                                <Download size={18} />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Floating Bug Report */}
        <button className="fixed bottom-6 right-6 bg-gradient-to-r from-red-600 to-rose-600 p-4 rounded-full shadow-lg shadow-red-900/50 hover:scale-110 transition active:scale-95 group z-50">
            <Bug className="text-white w-6 h-6 group-hover:rotate-12 transition" />
        </button>
    </div>
  );
}

export default function NCloud() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Engine...</div>}>
      <NCloudContent />
    </Suspense>
  );
}
