"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PROXY_BASE, SOURCE_DOMAIN, encodeBase64, parseHTML, fetchProxy } from "@/lib/utils";
import { Play, Search, Menu } from "lucide-react";

export default function Home() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const html = await fetchProxy(SOURCE_DOMAIN);
        if (!html) return;
        
        const doc = parseHTML(html);
        const articles = doc.querySelectorAll("article.post");
        const scrapedData: any[] = [];

        articles.forEach((art) => {
          const imgTag = art.querySelector("figure img");
          const titleTag = art.querySelector(".entry-title a");
          
          if (imgTag && titleTag) {
            const rawUrl = titleTag.getAttribute("href") || "";
            // Extract Slug Logic: https://movies4u.nexus/movie-name/ -> movie-name
            const slugPart = rawUrl.replace(SOURCE_DOMAIN, "").replace(/\//g, "");
            
            // Format: slug|||source_domain
            const fullSlug = `${slugPart}|||${SOURCE_DOMAIN}`; 

            scrapedData.push({
              title: titleTag.textContent?.trim(),
              poster: imgTag.getAttribute("src"),
              slug: encodeBase64(fullSlug)
            });
          }
        });

        setMovies(scrapedData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-3 flex justify-between items-center">
        <Menu className="text-white w-6 h-6" />
        <h1 className="text-2xl font-black text-red-600 tracking-tighter">NETVLYX</h1>
        <Search className="text-white w-6 h-6" />
      </nav>

      {/* Hero / Grid */}
      <main className="container mx-auto px-4 pt-20">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {/* Skeleton Loaders */}
             {[...Array(8)].map((_, i) => (
               <div key={i} className="aspect-[2/3] bg-gray-800/50 rounded-lg animate-pulse" />
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {movies.map((movie, i) => (
              <Link key={i} href={`/v/${movie.slug}`}>
                <div className="group relative aspect-[2/3] bg-gray-900 rounded-lg overflow-hidden cursor-pointer">
                  <img 
                    src={movie.poster} 
                    alt={movie.title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                  
                  <div className="absolute bottom-0 left-0 p-3 w-full">
                    <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight">
                        {movie.title}
                    </h3>
                  </div>

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600/90 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity scale-0 group-hover:scale-100 duration-300">
                    <Play fill="white" size={20} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
