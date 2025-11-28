export default function AuthSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="w-full max-w-md p-8 animate-pulse">
        {/* Logo */}
        <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gray-200" />
        
        {/* Title */}
        <div className="mx-auto mb-10 h-6 w-32 rounded bg-gray-200" />
        
        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <div className="h-11 w-full rounded-md bg-gray-200" />
          <div className="h-11 w-full rounded-md bg-gray-200" />
        </div>
        
        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-gray-200" />
          <div className="h-4 w-8 rounded bg-gray-200" />
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        
        {/* Email Input */}
        <div className="mb-4 h-11 w-full rounded-md bg-gray-200" />
        
        {/* Submit Button */}
        <div className="h-11 w-full rounded-md bg-gray-200" />
      </div>
    </div>
  );
}
