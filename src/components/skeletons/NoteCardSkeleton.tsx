type NoteCardSkeletonProps = {
  count?: number;
};

export default function NoteCardSkeleton({ count = 1 }: NoteCardSkeletonProps) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse overflow-hidden"
        >
          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 -translate-x-full shimmer bg-linear-to-r from-transparent via-white/60 to-transparent" />

          {/* Header: Avatar + Author Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-24 rounded bg-gray-200" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-full bg-gray-200" />
          </div>

          {/* Title */}
          <div className="h-5 w-3/4 rounded bg-gray-200 mb-3" />

          {/* Content Preview */}
          <div className="space-y-2 mb-4">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-11/12 rounded bg-gray-200" />
            <div className="h-4 w-4/5 rounded bg-gray-200" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
            <div className="h-5 w-16 rounded bg-gray-200" />
            <div className="h-5 w-16 rounded bg-gray-200" />
            <div className="h-5 w-16 rounded bg-gray-200" />
          </div>
        </article>
      ))}
      
      {/* shimmer keyframes defined globally in `globals.css` */}
    </div>
  );
}
