import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="flex items-start justify-center px-4 md:px-8">
      <div className="max-w-6xl w-full space-y-6 md:space-y-8 md:bg-white p-4 md:p-8 md:rounded-lg md:shadow-lg">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Profile Image */}
            <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full" />

          {/* Header Info */}
          <div className="flex-1 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between space-y-4 md:space-y-0">
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mx-auto md:mx-0 mb-2" />
                <Skeleton className="h-4 w-64 mx-auto md:mx-0 mb-2" />
                <Skeleton className="h-5 w-32 mx-auto md:mx-0" />
              </div>
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 md:p-3 rounded-lg">
                  <Skeleton className="w-4 h-4 md:w-5 md:h-5 rounded-full" />
                  <div className="min-w-0">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Email Confirmation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Skeleton className="h-10 w-48 rounded" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Form Sections */}
        <div className="space-y-6 md:space-y-8">
          {/* Personal Information */}
          <div>
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full rounded" />
              </div>
            </div>
          </div>

          {/* Category Interests */}
          <div>
            <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-4 w-36 mb-2" />
            <Skeleton className="h-10 w-full rounded mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-lg" />
                ))}
            </div>
          </div>

          {/* Security */}
          <div>
            <Skeleton className="h-6 w-20 mb-4" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Skeleton className="h-10 w-32 rounded" />
                <Skeleton className="h-4 w-64" />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex flex-col items-center md:items-end space-y-2">
            <Skeleton className="h-10 w-24 rounded" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
