export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-8 lg:py-12 px-4" aria-hidden>
      <div className="container mx-auto max-w-4xl relative">
        <div className="bg-white rounded-t-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.05)]">
          
          {/* Banner Skeleton */}
          <div className="relative h-48 sm:h-64 lg:h-80 bg-slate-200 animate-pulse rounded-b-[4.5rem]">
            <div className="absolute top-6 right-6 flex gap-3">
              <div className="h-10 w-10 rounded-full bg-white/40" />
              <div className="h-10 w-10 rounded-full bg-white/40" />
            </div>
          </div>

          {/* Logo & Info Skeleton */}
          <div className="px-4 sm:px-8 lg:px-12 -mt-12 sm:-mt-16 relative z-10">
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 sm:gap-6">
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-white p-2 shadow-xl animate-pulse">
                <div className="w-full h-full rounded-full bg-slate-100" />
              </div>
              <div className="flex-1 space-y-3 pb-2 w-full sm:w-auto">
                <div className="h-10 w-3/4 sm:w-1/2 rounded-xl bg-slate-200 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 w-24 rounded-full bg-slate-100 animate-pulse" />
                  <div className="h-6 w-32 rounded-full bg-slate-100 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-8 lg:px-12 py-10 space-y-10">
            {/* Search & Categories Skeleton */}
            <div className="space-y-6">
              <div className="h-14 w-full rounded-2xl bg-slate-100 animate-pulse" />
              <div className="flex gap-3 overflow-hidden">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 w-28 shrink-0 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            </div>

            {/* Grid Skeleton */}
            <div className="space-y-8">
              <div className="h-8 w-40 rounded-lg bg-slate-200 animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 overflow-hidden space-y-3 pb-4 animate-pulse">
                    <div className="aspect-square bg-slate-100" />
                    <div className="px-3 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-slate-100" />
                      <div className="h-6 w-1/2 rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Cart Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4">
          <div className="h-20 w-full max-w-4xl rounded-[2.5rem] bg-slate-200 animate-pulse shadow-2xl" />
        </div>
      </div>
    </div>
  );
}
