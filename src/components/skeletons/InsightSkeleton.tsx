export default function InsightSkeleton() {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-6 md:py-10">
        {/* Header Section */}
        <header className="mb-6 md:mb-8">
          <div className="h-10 w-full max-w-xs rounded-lg skeleton-bg mb-2" />
          <div className="h-5 w-full max-w-md rounded-lg skeleton-bg" />
        </header>

        {/* Top row: stats + top 3 public notes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Stats Card */}
          <div className="bg-surface rounded-xl p-6 shadow-sm border border-variant relative overflow-hidden" role="status" aria-busy="true">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 shimmer" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.25), rgba(255,255,255,0))' }} />
            </div>
            <div className="h-6 w-24 rounded-lg skeleton-bg mb-4" />
            <div className="flex flex-col gap-4">
              <div className="bg-card rounded-lg p-4 border border-variant">
                <div className="h-4 w-32 rounded skeleton-bg mb-2 mx-auto" />
                <div className="h-8 w-16 rounded skeleton-bg mt-2 mx-auto" />
              </div>
              <div className="bg-card rounded-lg p-4 border border-variant">
                <div className="h-4 w-32 rounded skeleton-bg mb-2 mx-auto" />
                <div className="h-8 w-16 rounded skeleton-bg mt-2 mx-auto" />
              </div>
            </div>
          </div>

          {/* Top Notes Card */}
          <div className="lg:col-span-2 bg-surface rounded-xl p-6 shadow-sm border border-variant relative overflow-hidden" role="status" aria-busy="true">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 shimmer" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.25), rgba(255,255,255,0))' }} />
            </div>
            <div className="h-6 w-full max-w-xs rounded-lg skeleton-bg mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-lg p-4 border border-variant">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full skeleton-bg shrink-0" />
                    <div className="h-4 w-full max-w-xs rounded skeleton-bg" />
                  </div>
                  <div className="flex gap-3 ml-6">
                    <div className="h-3 w-16 rounded skeleton-bg" />
                    <div className="h-3 w-16 rounded skeleton-bg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Public Chart */}
          <div className="bg-surface rounded-xl p-6 shadow-sm border border-variant relative overflow-hidden" role="status" aria-busy="true">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 shimmer" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.18), rgba(255,255,255,0))' }} />
            </div>
            <div className="h-6 w-full max-w-sm rounded-lg skeleton-bg mb-6" />
            <div className="h-64 rounded-lg skeleton-bg" />
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full skeleton-bg" />
                  <div className="h-3 w-20 rounded skeleton-bg" />
                </div>
              ))}
            </div>
          </div>

          {/* Private Chart */}
          <div className="bg-surface rounded-xl p-6 shadow-sm border border-variant relative overflow-hidden" role="status" aria-busy="true">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 shimmer" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.18), rgba(255,255,255,0))' }} />
            </div>
            <div className="h-6 w-full max-w-sm rounded-lg skeleton-bg mb-6" />
            <div className="h-64 rounded-lg skeleton-bg" />
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full skeleton-bg" />
                  <div className="h-3 w-20 rounded skeleton-bg" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Trend Chart */}
          <div className="bg-surface rounded-xl p-6 shadow-sm border border-variant">
          <div className="h-6 w-full max-w-xs rounded-lg skeleton-bg mb-6" />
          <div className="h-80 rounded-lg skeleton-bg" />
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full skeleton-bg" />
                <div className="h-3 w-16 rounded skeleton-bg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
