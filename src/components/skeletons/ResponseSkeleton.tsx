export default function ResponseSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
      <div className="h-6 w-32 rounded bg-gray-200 mb-4" />
      
      {/* Response Input Skeleton */}
      <div className="mb-6 space-y-3">
        <div className="h-20 w-full rounded-lg bg-gray-200" />
        <div className="flex justify-end">
          <div className="h-9 w-24 rounded-lg bg-gray-200" />
        </div>
      </div>

      {/* Response List */}
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="flex gap-4 mt-2">
                <div className="h-3 w-12 rounded bg-gray-200" />
                <div className="h-3 w-12 rounded bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
