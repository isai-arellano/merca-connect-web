export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-[#FFF3FB]" aria-hidden>
      <div className="mx-auto w-full max-w-[470px] px-3 py-4 sm:px-4 sm:py-6 space-y-4">
        {/* Header skeleton */}
        <div className="relative overflow-hidden rounded-3xl h-44 sm:h-52 bg-[#D1C7F8] animate-pulse">
          <div className="absolute right-3 top-3 flex gap-2">
            <div className="h-8 w-8 rounded-full bg-[#D8C9EB]" />
            <div className="h-8 w-8 rounded-full bg-[#D8C9EB]" />
            <div className="h-8 w-8 rounded-full bg-[#D8C9EB]" />
          </div>
          <div className="absolute bottom-4 left-4 flex items-end gap-3">
            <div className="h-16 w-16 rounded-2xl bg-[#D8C9EB]" />
            <div className="space-y-3 pb-1">
              <div className="h-7 w-48 rounded-lg bg-[#D8C9EB]" />
              <div className="h-4 w-28 rounded-md bg-[#CCB7E3]" />
              <div className="flex gap-2">
                <div className="h-6 w-24 rounded-full bg-[#DDCAEE]" />
                <div className="h-6 w-20 rounded-full bg-[#DDCAEE]" />
              </div>
            </div>
          </div>
        </div>

        {/* Description skeleton */}
        <div className="h-12 rounded-xl bg-[#F6E9FA] animate-pulse" />

        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 rounded-xl bg-[#F6E9FA] animate-pulse" />
          <div className="h-14 rounded-xl bg-[#F6E9FA] animate-pulse" />
        </div>

        {/* Filter bar skeleton */}
        <div className="space-y-3 mt-6">
          <div className="h-10 rounded-xl bg-[#F6E9FA] animate-pulse" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-[#F6E9FA] animate-pulse" />
            ))}
          </div>
        </div>

        {/* Product grid skeleton */}
        <div className="mt-5 space-y-8">
          {[...Array(2)].map((_, s) => (
            <div key={s} className="space-y-4">
              <div className="h-6 w-36 rounded-lg bg-[#EADDF6] animate-pulse" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-[#FFFDFE] border border-[#E8DAF3] overflow-hidden animate-pulse"
                    style={{ animationDelay: `${(i + s * 6) * 60}ms` }}
                  >
                    <div className="aspect-square bg-[#F7EEF9]" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 w-3/4 rounded-md bg-[#E7D8F2]" />
                      <div className="h-3 w-1/2 rounded-md bg-[#F0E6F8]" />
                      <div className="h-8 w-full rounded-xl bg-[#EFE5F8]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-4 left-1/2 h-14 w-[min(92vw,420px)] -translate-x-1/2 rounded-full bg-white/90 shadow-2xl animate-pulse" />
      </div>
    </div>
  );
}
