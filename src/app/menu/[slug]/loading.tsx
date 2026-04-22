export default function MenuLoading() {
  return (
    <div className="min-h-screen bg-[#152E28]" aria-hidden>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 space-y-6">
        {/* Header skeleton */}
        <div className="relative overflow-hidden rounded-2xl h-48 sm:h-64 bg-[#1F3D35] animate-pulse">
          <div className="absolute bottom-6 left-6 sm:left-10 flex items-end gap-6">
            <div className="h-24 w-24 rounded-2xl bg-[#152E28]/60" />
            <div className="space-y-3 pb-1">
              <div className="h-7 w-48 rounded-lg bg-[#152E28]/60" />
              <div className="h-4 w-28 rounded-md bg-[#152E28]/50" />
              <div className="flex gap-2">
                <div className="h-6 w-24 rounded-full bg-[#152E28]/50" />
                <div className="h-6 w-20 rounded-full bg-[#152E28]/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Description skeleton */}
        <div className="h-12 rounded-xl bg-[#1F3D35]/60 animate-pulse" />

        {/* Filter bar skeleton */}
        <div className="space-y-3 mt-6">
          <div className="h-10 rounded-xl bg-[#1F3D35]/60 animate-pulse" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-full bg-[#1F3D35]/60 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Menu list skeleton */}
        <div className="mt-8 mx-auto max-w-2xl space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-2xl bg-[#1F3D35]/60 p-4 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex-1 space-y-2">
                <div className="h-5 w-2/3 rounded-md bg-[#152E28]/50" />
                <div className="h-3 w-full rounded-md bg-[#152E28]/35" />
                <div className="h-3 w-4/5 rounded-md bg-[#152E28]/35" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-6 w-16 rounded-md bg-[#74E79C]/15" />
                  <div className="h-8 w-24 rounded-full bg-[#74E79C]/15" />
                </div>
              </div>
              <div className="h-24 w-24 shrink-0 rounded-xl bg-[#152E28]/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
