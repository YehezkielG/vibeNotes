import NoteCardSkeleton from "@/components/skeletons/NoteCardSkeleton";

type ProfileSkeletonProps = {
  noteCount?: number;
};

export default function ProfileSkeleton({ noteCount = 3 }: ProfileSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="relative flex items-center gap-4 rounded-xl bg-card backdrop-blur" role="status" aria-busy="true">
        <div className="w-24 h-24 rounded-full overflow-hidden shrink-0">
          <div className="w-full h-full skeleton-bg" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-full skeleton-bg" />
          <div className="h-3 w-24 rounded-full skeleton-bg" />
          <div className="flex gap-4 text-xs text-muted">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-3 w-16 rounded-full skeleton-bg" />
            ))}
          </div>
        </div>
        <div className="ml-auto h-8 w-28 rounded-full skeleton-bg" />

        {/* shimmer */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="shimmer"
            style={{
              width: "38%",
              height: "100%",
              background: "var(--shimmer-overlay)",
              transform: "translateX(-120%)",
            }}
          />
        </div>
      </div>
        <hr className="my-10 mb-15 border-variant"/>
      <NoteCardSkeleton count={noteCount} />
    </div>
  );
}
