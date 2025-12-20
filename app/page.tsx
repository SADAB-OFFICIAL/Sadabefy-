"use client";

import Image from "next/image";

const movies = [
  {
    title: "Dhurandhar",
    image: "/poster1.jpg",
    rating: "6.4",
    tag: "Trending Now",
  },
  {
    title: "Raat Akeli Hai",
    image: "/poster2.jpg",
  },
  {
    title: "A Time For Bravery",
    image: "/poster3.jpg",
  },
];

export default function Home() {
  return (
    <main className="bg-[#0b0b0b] text-white min-h-screen">
      {/* 🔥 NAVBAR */}
      <header className="flex items-center justify-between px-4 py-3 bg-black sticky top-0 z-50">
        <h1 className="text-xl font-bold text-red-600">NetVlyx</h1>
        <div className="flex gap-4 items-center">
          <button className="text-green-500">WhatsApp</button>
          <button>🔍</button>
        </div>
      </header>

      {/* 🎬 HERO SECTION */}
      <section className="relative h-[420px] w-full">
        <Image
          src="/hero.jpg"
          alt="Hero"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-6 left-4 space-y-3">
          <span className="bg-red-600 px-3 py-1 rounded text-sm">
            Trending Now
          </span>
          <h2 className="text-2xl font-bold">Dhurandhar</h2>
          <p className="text-gray-300 text-sm max-w-sm">
            An Indian intelligence mission unfolds over ten years...
          </p>

          <div className="flex gap-3">
            <button className="bg-red-600 px-6 py-2 rounded font-semibold">
              ▶ Watch
            </button>
            <button className="bg-white/20 px-6 py-2 rounded">
              ℹ More Info
            </button>
          </div>
        </div>
      </section>

      {/* 📦 LATEST UPLOADS */}
      <Section title="Latest Uploads">
        {movies.map((m, i) => (
          <Card key={i} movie={m} />
        ))}
      </Section>

      {/* 🔢 POPULAR IN INDIA */}
      <section className="px-4 mt-8">
        <h2 className="text-lg font-semibold mb-4">
          What's Popular in India
        </h2>
        <div className="flex gap-6 overflow-x-auto">
          {[1, 2].map((n) => (
            <div key={n} className="relative min-w-[160px]">
              <span className="absolute -left-6 bottom-0 text-7xl font-extrabold text-white/20">
                {n}
              </span>
              <Image
                src={`/popular${n}.jpg`}
                alt="Popular"
                width={160}
                height={240}
                className="rounded-lg"
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

/* 🔹 COMPONENTS */

function Section({ title, children }: any) {
  return (
    <section className="px-4 mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-gray-400">View All</span>
      </div>
      <div className="flex gap-4 overflow-x-auto">{children}</div>
    </section>
  );
}

function Card({ movie }: any) {
  return (
    <div className="min-w-[140px] bg-[#141414] rounded-lg overflow-hidden">
      <Image
        src={movie.image}
        alt={movie.title}
        width={140}
        height={200}
        className="object-cover"
      />
      <div className="p-2">
        <p className="text-sm font-medium truncate">{movie.title}</p>
      </div>
    </div>
  );
}arent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
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
