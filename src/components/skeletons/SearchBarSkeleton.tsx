export default function SearchBarSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="h-12 w-full rounded-xl bg-gray-200" />
      </div>

      {/* Top Notes Section */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-gray-200" />
            <div className="h-6 w-32 rounded bg-gray-200" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-linear-to-br from-white to-gray-50 rounded-xl p-4 border border-gray-200">
              {/* Rank Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <div className="h-4 w-16 rounded-full bg-gray-200" />
              </div>

              {/* Title */}
              <div className="h-5 w-3/4 rounded bg-gray-200 mb-2" />

              {/* Stats */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 rounded bg-gray-200" />
                  <div className="h-4 w-8 rounded bg-gray-200" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 rounded bg-gray-200" />
                  <div className="h-4 w-8 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
