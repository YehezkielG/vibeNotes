export default function InsightSkeleton() {
  return (
    <div className="min-h-screen bg-transparent animate-pulse">
      <div className="container mx-auto px-4 py-6 md:py-10">
        {/* Header Section */}
        <header className="mb-6 md:mb-8">
          <div className="h-10 w-64 rounded-lg bg-gray-200 mb-2" />
          <div className="h-5 w-80 rounded-lg bg-gray-200" />
        </header>

        {/* Top row: stats + top 3 public notes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Stats Card */}
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="h-6 w-24 rounded-lg bg-gray-200 mb-4" />
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="h-4 w-32 rounded bg-gray-200 mb-2 mx-auto" />
                <div className="h-8 w-16 rounded bg-gray-200 mt-2 mx-auto" />
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="h-4 w-32 rounded bg-gray-200 mb-2 mx-auto" />
                <div className="h-8 w-16 rounded bg-gray-200 mt-2 mx-auto" />
              </div>
            </div>
          </div>

          {/* Top Notes Card */}
          <div className="lg:col-span-2 bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="h-6 w-48 rounded-lg bg-gray-200 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-3 w-3 rounded-full bg-gray-200" />
                    <div className="h-4 w-48 rounded bg-gray-200" />
                  </div>
                  <div className="flex gap-3 ml-6">
                    <div className="h-3 w-16 rounded bg-gray-200" />
                    <div className="h-3 w-16 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Public Chart */}
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="h-6 w-56 rounded-lg bg-gray-200 mb-6" />
            <div className="h-64 rounded-lg bg-gray-200" />
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>

          {/* Private Chart */}
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="h-6 w-56 rounded-lg bg-gray-200 mb-6" />
            <div className="h-64 rounded-lg bg-gray-200" />
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Trend Chart */}
        <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="h-6 w-48 rounded-lg bg-gray-200 mb-6" />
          <div className="h-80 rounded-lg bg-gray-200" />
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-200" />
                <div className="h-3 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
