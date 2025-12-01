export default function SuggestionsSkeleton() {
  return (
    <aside className="relative" role="status" aria-busy="true">
      <div className="h-5 w-32 rounded skeleton-bg mb-3" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-full skeleton-bg" />
              <div className="space-y-1 flex-1">
                <div className="h-3 w-24 rounded skeleton-bg" />
                <div className="h-3 w-20 rounded skeleton-bg" />
              </div>
            </div>
            <div className="h-7 w-16 rounded-full skeleton-bg" />
          </div>
        ))}
      </div>

      {/* subtle shimmer overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="shimmer"
          style={{
            width: "40%",
            height: "100%",
            background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)",
            transform: "translateX(-120%)",
          }}
        />
      </div>
    </aside>
  );
}
