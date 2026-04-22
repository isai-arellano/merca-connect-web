export default function CatalogoLoading() {
  return (
    <div className="min-h-screen bg-[#1A3E35]" aria-hidden>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 space-y-6">
        {/* Header skeleton */}
        <div className="relative overflow-hidden rounded-2xl h-48 sm:h-64 bg-[#234A40] animate-pulse">
          <div className="absolute bottom-6 left-6 sm:left-10 flex items-end gap-6">
            <div className="h-24 w-24 rounded-2xl bg-[#1A3E35]/60" />
            <div className="space-y-3 pb-1">
              <div className="h-7 w-48 rounded-lg bg-[#1A3E35]/60" />
              <div className="h-4 w-28 rounded-md bg-[#1A3E35]/50" />
              <div className="flex gap-2">
                <div className="h-6 w-24 rounded-full bg-[#1A3E35]/50" />
                <div className="h-6 w-20 rounded-full bg-[#1A3E35]/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Description skeleton */}
        <div className="h-12 rounded-xl bg-[#234A40]/60 animate-pulse" />

        {/* Filter bar skeleton */}
        <div className="space-y-3 mt-6">
          <div className="h-10 rounded-xl bg-[#234A40]/60 animate-pulse" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-[#234A40]/60 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Product grid skeleton */}
        <div className="mt-8 space-y-8">
          {[...Array(2)].map((_, s) => (
            <div key={s} className="space-y-4">
              <div className="h-6 w-36 rounded-lg bg-[#234A40]/60 animate-pulse" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-[#234A40]/60 overflow-hidden animate-pulse"
                    style={{ animationDelay: `${(i + s * 6) * 60}ms` }}
                  >
                    <div className="aspect-square bg-[#1A3E35]/40" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 w-3/4 rounded-md bg-[#1A3E35]/40" />
                      <div className="h-3 w-1/2 rounded-md bg-[#1A3E35]/30" />
                      <div className="h-8 w-full rounded-xl bg-[#74E79C]/15" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
