export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-[#FFF3EA]" aria-hidden>
      <div className="mx-auto w-full max-w-[470px] px-3 py-4 sm:px-4 sm:py-6 space-y-4">
        {/* Header skeleton */}
        <div className="relative overflow-hidden rounded-3xl h-44 sm:h-52 bg-[#FFD4B8] animate-pulse">
          <div className="absolute right-3 top-3 flex gap-2">
            <div className="h-8 w-8 rounded-full bg-[#F2D8CA]" />
            <div className="h-8 w-8 rounded-full bg-[#F2D8CA]" />
            <div className="h-8 w-8 rounded-full bg-[#F2D8CA]" />
          </div>
          <div className="absolute bottom-4 left-4 flex items-end gap-3">
            <div className="h-16 w-16 rounded-2xl bg-[#F2D8CA]" />
            <div className="space-y-3 pb-1">
              <div className="h-7 w-48 rounded-lg bg-[#F2D8CA]" />
              <div className="h-4 w-28 rounded-md bg-[#E7CBC0]" />
              <div className="flex gap-2">
                <div className="h-6 w-24 rounded-full bg-[#EFD4C8]" />
                <div className="h-6 w-20 rounded-full bg-[#EFD4C8]" />
              </div>
            </div>
          </div>
        </div>

        {/* Description skeleton */}
        <div className="h-12 rounded-xl bg-[#FFE8DA] animate-pulse" />

        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 rounded-xl bg-[#FFE8DA] animate-pulse" />
          <div className="h-14 rounded-xl bg-[#FFE8DA] animate-pulse" />
        </div>

        {/* Filter bar skeleton */}
        <div className="space-y-3 mt-6">
          <div className="h-10 rounded-xl bg-[#FFE8DA] animate-pulse" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-[#FFE8DA] animate-pulse" />
            ))}
          </div>
        </div>

        {/* Menu list skeleton */}
        <div className="mt-5 mx-auto max-w-2xl space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-2xl bg-[#FFFDFB] p-4 animate-pulse border border-[#F2DECF]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex-1 space-y-2">
                <div className="h-5 w-2/3 rounded-md bg-[#F0DCCF]" />
                <div className="h-3 w-full rounded-md bg-[#F7E9E0]" />
                <div className="h-3 w-4/5 rounded-md bg-[#F7E9E0]" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-6 w-16 rounded-md bg-[#FFDCC8]" />
                  <div className="h-8 w-24 rounded-full bg-[#FFDCC8]" />
                </div>
              </div>
              <div className="h-24 w-24 shrink-0 rounded-xl bg-[#F7E9E0]" />
            </div>
          ))}
        </div>

        <div className="fixed bottom-4 left-1/2 h-14 w-[min(92vw,420px)] -translate-x-1/2 rounded-full bg-white/90 shadow-2xl animate-pulse" />
      </div>
    </div>
  );
}
