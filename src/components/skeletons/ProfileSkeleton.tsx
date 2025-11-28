import NoteCardSkeleton from "@/components/skeletons/NoteCardSkeleton";

type ProfileSkeletonProps = {
  noteCount?: number;
};

export default function ProfileSkeleton({ noteCount = 3 }: ProfileSkeletonProps) {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-hidden relative">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full shimmer bg-linear-to-r from-transparent via-white/60 to-transparent" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gray-200 shrink-0" />
          
          {/* Info */}
          <div className="flex-1 space-y-3">
            <div className="h-7 w-48 rounded bg-gray-200" />
            <div className="h-4 w-32 rounded bg-gray-200" />
            
            {/* Bio */}
            <div className="space-y-2 mt-3">
              <div className="h-3 w-full max-w-md rounded bg-gray-200" />
              <div className="h-3 w-3/4 max-w-sm rounded bg-gray-200" />
            </div>
            
            {/* Stats */}
            <div className="flex gap-6 mt-4">
              {[0, 1, 2].map((item) => (
                <div key={item} className="space-y-1">
                  <div className="h-3 w-16 rounded bg-gray-200" />
                  <div className="h-5 w-12 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Action Button */}
          <div className="h-10 w-32 rounded-lg bg-gray-200 shrink-0" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-10 w-24 rounded-t bg-gray-200" />
        ))}
      </div>

      {/* Notes Section */}
      <NoteCardSkeleton count={noteCount} />
      
      {/* shimmer keyframes defined globally in `globals.css` */}
    </div>
  );
}
