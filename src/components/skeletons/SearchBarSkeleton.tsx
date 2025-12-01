export default function SearchBarSkeleton() {
  return (
    <div className="relative space-y-6" role="status" aria-busy="true">
      {/* Search Bar */}
      <div className="relative">
        <div className="h-12 w-full rounded-xl skeleton-bg" />
      </div>

      {/* Top Notes Section */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded skeleton-bg" />
            <div className="h-6 w-32 rounded skeleton-bg" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-4 border border-gray-200 bg-card">
              {/* Rank Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-full skeleton-bg" />
                <div className="h-4 w-16 rounded-full skeleton-bg" />
              </div>

              {/* Title */}
              <div className="h-5 w-3/4 rounded skeleton-bg mb-2" />

              {/* Stats */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 rounded skeleton-bg" />
                  <div className="h-4 w-8 rounded skeleton-bg" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 rounded skeleton-bg" />
                  <div className="h-4 w-8 rounded skeleton-bg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* subtle shimmer overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="shimmer"
          style={{
            width: "36%",
            height: "100%",
            background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)",
            transform: "translateX(-120%)",
          }}
        />
      </div>
    </div>
  );
}
