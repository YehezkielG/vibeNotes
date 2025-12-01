export default function ResponseSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="relative bg-card rounded-xl shadow-sm border border-variant p-5 overflow-hidden" role="status" aria-busy="true">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 shimmer" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.4), rgba(255,255,255,0))' }} />
      </div>
      <div className="h-6 w-32 rounded skeleton-bg mb-4" />

      {/* Response Input Skeleton */}
      <div className="mb-6 space-y-3">
        <div className="h-20 w-full rounded-lg skeleton-bg" />
        <div className="flex justify-end">
          <div className="h-9 w-24 rounded-lg skeleton-bg" />
        </div>
      </div>

      {/* Response List */}
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-3 pb-4 border-b border-variant last:border-0">
            <div className="w-10 h-10 rounded-full skeleton-bg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded skeleton-bg" />
              <div className="h-4 w-full rounded skeleton-bg" />
              <div className="h-4 w-3/4 rounded skeleton-bg" />
              <div className="flex gap-4 mt-2">
                <div className="h-3 w-12 rounded skeleton-bg" />
                <div className="h-3 w-12 rounded skeleton-bg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
