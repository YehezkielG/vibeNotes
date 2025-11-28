export default function EditNoteSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-20 rounded-md bg-gray-200" />
        <div className="h-6 w-6 rounded bg-gray-200" />
        <div className="h-6 w-24 rounded bg-gray-200" />
        <div className="ml-auto h-9 w-28 rounded-md bg-gray-200" />
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Title Input */}
        <div className="border-b border-gray-200 pb-2">
          <div className="h-7 w-64 rounded bg-gray-200" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 pb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-20 rounded-md bg-gray-200" />
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-3">
          <div className="h-5 w-full rounded bg-gray-200" />
          <div className="h-5 w-11/12 rounded bg-gray-200" />
          <div className="h-5 w-10/12 rounded bg-gray-200" />
          <div className="h-5 w-full rounded bg-gray-200" />
          <div className="h-5 w-9/12 rounded bg-gray-200" />
          <div className="h-5 w-11/12 rounded bg-gray-200" />
          <div className="h-5 w-8/12 rounded bg-gray-200" />
        </div>

        <div className="pt-10">
          <div className="h-5 w-full rounded bg-gray-200" />
          <div className="h-5 w-10/12 rounded bg-gray-200 mt-3" />
          <div className="h-5 w-11/12 rounded bg-gray-200 mt-3" />
        </div>

        {/* Visibility Badge */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-full bg-gray-200" />
          <div className="h-4 w-48 rounded bg-gray-200" />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6">
          <div className="h-12 w-24 rounded-xl bg-gray-200" />
          <div className="h-12 w-32 rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
