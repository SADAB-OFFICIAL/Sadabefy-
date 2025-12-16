"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProxy, parseHTML, encodeBase64, SOURCE_DOMAIN } from "@/lib/utils";
// ✅ FIXED: Added ChevronLeft to imports
import { 
  Play, 
  Info, 
  Search, 
  Film, 
  MessageCircle, 
  Star, 
  ChevronLeft, 
  MonitorPlay
} from "lucide-react";

// --- TYPES ---
interface Movie {
  title: string;
  poster: string;
  slug: string;
  rating?: string;
  quality?: string;
}

export default function Home() {
  // State for different sections
  const [featured, setFeatured] = useState<Movie | null>(null);
  const [latest, setLatest] = useState<Movie[]>([]);
  const [bollywood, setBollywood] = useState<Movie[]>([]);
  const [hollywood, setHollywood] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // --- SCRAPING HELPER ---
  const fetchMovies = async (path: string): Promise<Movie[]> => {
    try {
      const url = path === "home" ? SOURCE_DOMAIN : `${SOURCE_DOMAIN}/category/${path}/`;
      const html = await fetchProxy(url);
      if (!html) return [];

      const doc = parseHTML(html);
      const articles = doc.querySelectorAll("article.post");
      const data: Movie[] = [];

      articles.forEach((art) => {
        const titleTag = art.querySelector(".entry-title a");
        const imgTag = art.querySelector("figure img");
        
        if (titleTag && imgTag) {
          const rawUrl = titleTag.getAttribute("href") || "";
          // Clean Slug Logic
          let slugPart = rawUrl.replace(SOURCE_DOMAIN, "");
          if (slugPart.startsWith("/")) slugPart = slugPart.substring(1);
          if (slugPart.endsWith("/")) slugPart = slugPart.substring(0, slugPart.length - 1);
          
          const fullSlug = `${slugPart}|||${SOURCE_DOMAIN}`;

          data.push({
            title: titleTag.textContent?.trim() || "Untitled",
            poster: imgTag.getAttribute("src") || "",
            slug: encodeBase64(fullSlug),
            rating: (Math.random() * (9 - 5) + 5).toFixed(1), // Mock Rating for UI
            quality: "HD"
          });
        }
      });
      return data;
    } catch (e) {
      console.error("Error fetching category:", path, e);
      return [];
    }
  };

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    const loadAll = async () => {
      // 1. Fetch Latest (Home)
      const latestData = await fetchMovies("home");
      if (latestData.length > 0) {
        setFeatured(latestData[0]); // First movie as Hero
        setLatest(latestData.slice(1)); // Rest as latest
      }

      // 2. Fetch Bollywood
      const bollyData = await fetchMovies("bollywood");
      setBollywood(bollyData);

      // 3. Fetch Hollywood
      const hollyData = await fetchMovies("hollywood");
      setHollywood(hollyData);

      setLoading(false);
    };

    loadAll();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-20 overflow-x-hidden">
      
      {/* =======================
          1. NAVBAR (Sticky)
      ======================== */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-gradient-to-b from-black/90 to-transparent px-4 py-4 flex items-center justify-between">
         {/* Logo Section */}
         <div className="flex items-center gap-3">
             <div className="bg-[#E50914] p-1.5 rounded-lg">
                 <Film className="text-white w-6 h-6" />
             </div>
             <span className="text-2xl font-bold tracking-tighter text-[#E50914]">NetVlyx</span>
         </div>

         {/* Right Icons */}
         <div className="flex items-center gap-4">
             {/* WhatsApp Button */}
             <a href="#" className="w-10 h-10 rounded-full bg-green-600/20 border border-green-500/50 flex items-center justify-center text-green-500 backdrop-blur-md">
                 <MessageCircle size={20} />
             </a>
             {/* Search Button */}
             <button className="w-10 h-10 rounded-full bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-500 backdrop-blur-md">
                 <Search size={20} />
             </button>
         </div>
      </nav>

      {/* =======================
          2. HERO SECTION
      ======================== */}
      {loading ? (
          <div className="h-[70vh] w-full bg-gray-900 animate-pulse"></div>
      ) : featured && (
        <div className="relative w-full h-[85vh] md:h-[90vh]">
            {/* Background Image */}
            <img 
                src={featured.poster} 
                alt={featured.title} 
                className="w-full h-full object-cover object-center brightness-75"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent"></div>

            {/* Hero Content */}
            <div className="absolute bottom-0 left-0 w-full px-4 pb-12 md:pb-16 flex flex-col items-center text-center">
                
                {/* Badges */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="bg-[#E50914] text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide">
                        Trending Now
                    </span>
                    <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1">
                        <Star size={10} fill="black" /> {featured.rating}
                    </span>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase">
                        TV Series
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-none drop-shadow-2xl max-w-2xl mx-auto">
                    {featured.title}
                </h1>

                {/* Description (Truncated) */}
                <p className="text-gray-200 text-sm md:text-base line-clamp-2 max-w-lg mx-auto mb-6 drop-shadow-md">
                    Stream the latest blockbuster directly on NetVlyx. High quality, multi-language support, and fast servers.
                </p>

                {/* Action Buttons */}
                <div className="flex gap-4 w-full max-w-md">
                    <Link href={`/v/${featured.slug}`} className="flex-1 bg-white text-black py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition">
                        <Play fill="black" size={20} />
                        Watch
                    </Link>
                    <Link href={`/v/${featured.slug}`} className="flex-1 bg-gray-600/80 backdrop-blur-md text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-600 transition">
                        <Info size={20} />
                        More Info
                    </Link>
                </div>

                {/* Pagination Dots (Visual Only) */}
                <div className="flex gap-2 mt-8">
                    {[1,2,3,4,5].map((dot, i) => (
                        <div key={i} className={`h-2 rounded-full transition-all ${i === 0 ? 'w-6 bg-red-600' : 'w-2 bg-gray-600'}`}></div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* =======================
          3. HORIZONTAL LISTS
      ======================== */}
      <div className="space-y-8 -mt-6 relative z-10 px-4">
          
          <MovieRow title="Latest Uploads" movies={latest} loading={loading} />
          <MovieRow title="Latest Bollywood Movies" movies={bollywood} loading={loading} />
          <MovieRow title="Latest Hollywood Movies" movies={hollywood} loading={loading} />

      </div>
    </div>
  );
}

// --- SUB COMPONENT: MOVIE ROW ---
function MovieRow({ title, movies, loading }: { title: string, movies: Movie[], loading: boolean }) {
    if (loading) return (
        <div className="space-y-3 mb-8">
            <div className="h-6 w-40 bg-gray-800 rounded animate-pulse"></div>
            <div className="flex gap-4 overflow-hidden">
                {[1,2,3].map(i => <div key={i} className="w-[140px] h-[200px] bg-gray-800 rounded-lg shrink-0 animate-pulse"></div>)}
            </div>
        </div>
    );

    if (movies.length === 0) return null;

    return (
        <div className="mb-8">
            {/* Section Header */}
            <div className="flex justify-between items-end mb-4 px-1">
                <h2 className="text-lg font-bold text-white leading-none">{title}</h2>
                <span className="text-xs text-red-500 font-semibold cursor-pointer flex items-center hover:underline">
                    View All <ChevronLeft className="rotate-180 w-3 h-3" />
                </span>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {movies.map((movie, idx) => (
                    <Link key={idx} href={`/v/${movie.slug}`} className="shrink-0 snap-start">
                        <div className="w-[150px] md:w-[180px] relative group">
                            {/* Card Image */}
                            <div className="aspect-[2/3] rounded-lg overflow-hidden relative bg-gray-800">
                                <img 
                                    src={movie.poster} 
                                    alt={movie.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    loading="lazy"
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                {/* Center Play Button (On Hover) */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100">
                                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                                        <Play fill="white" size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Movie Title below card */}
                            <h3 className="text-xs md:text-sm font-medium text-gray-300 mt-2 line-clamp-1 group-hover:text-white transition-colors">
                                {movie.title}
                            </h3>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
                }
