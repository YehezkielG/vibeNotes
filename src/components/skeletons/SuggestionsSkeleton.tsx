export default function SuggestionsSkeleton() {
  return (
    <aside className="animate-pulse">
      <div className="h-5 w-32 rounded bg-gray-200 mb-3" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-full bg-gray-200" />
              <div className="space-y-1 flex-1">
                <div className="h-3 w-24 rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-200" />
              </div>
            </div>
            <div className="h-7 w-16 rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
    </aside>
  );
}
