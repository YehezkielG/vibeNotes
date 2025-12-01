export default function NoteDetailLoading() {
  return (
    <section className="space-y-6">
      <article className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse overflow-hidden">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full shimmer bg-linear-to-r from-transparent via-white/60 to-transparent" />
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-200" />
            </div>
          </div>
          <div className="h-10 w-28 rounded-full bg-gray-200" />
        </div>

        {/* Title */}
        <div className="h-7 w-3/4 rounded bg-gray-200 mb-4" />

        {/* Content */}
        <div className="space-y-3 mb-6">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-11/12 rounded bg-gray-200" />
          <div className="h-4 w-10/12 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-9/12 rounded bg-gray-200" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-6 pt-3 border-t border-gray-100 mb-5">
          <div className="h-5 w-16 rounded bg-gray-200" />
          <div className="h-5 w-16 rounded bg-gray-200" />
          <div className="h-5 w-16 rounded bg-gray-200" />
        </div>

      </article>
    
        {/* Emotion Tags */}
        <div className="flex gap-3 flex-wrap animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-28 rounded-2xl bg-gray-200" />
          ))}
        </div>
        
      {/* Response Section Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
        <div className="h-6 w-32 rounded bg-gray-200 mb-4" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* shimmer keyframes defined globally in `globals.css` */}
    </section>
  );
}
