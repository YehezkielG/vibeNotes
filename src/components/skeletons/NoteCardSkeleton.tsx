type NoteCardSkeletonProps = {
  count?: number;
};

export default function NoteCardSkeleton({ count = 1 }: NoteCardSkeletonProps) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="relative bg-card rounded-xl shadow-sm border border-variant p-5 overflow-hidden"
          role="status"
          aria-busy="true"
        >
          {/* subtle shimmer overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 shimmer" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.45), rgba(255,255,255,0))' }} />
          </div>

          {/* Header: Avatar + Author Info */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full skeleton-bg shrink-0" />
              <div className="flex flex-col gap-2">
                <div className="h-4 w-32 rounded skeleton-bg" />
                <div className="h-3 w-24 rounded skeleton-bg" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-full skeleton-bg" />
          </div>

          {/* Title */}
          <div className="h-5 w-3/4 rounded skeleton-bg mb-3" />

          {/* Content Preview */}
          <div className="space-y-2 mb-4">
            <div className="h-4 w-full rounded skeleton-bg" />
            <div className="h-4 w-11/12 rounded skeleton-bg" />
            <div className="h-4 w-4/5 rounded skeleton-bg" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
            <div className="h-5 w-16 rounded skeleton-bg" />
            <div className="h-5 w-16 rounded skeleton-bg" />
            <div className="h-5 w-16 rounded skeleton-bg" />
          </div>
        </article>
      ))}
      
      {/* shimmer keyframes defined globally in `globals.css` */}
    </div>
  );
}
