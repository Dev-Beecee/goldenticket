export function RegistrationPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col items-center mb-8">
        <div className="h-16 w-16 rounded-full bg-muted mb-4"></div>
        <div className="h-8 w-64 bg-muted rounded mb-3"></div>
        <div className="h-4 w-80 bg-muted rounded"></div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <div className="h-5 w-20 bg-muted rounded"></div>
            <div className="h-10 w-full bg-muted rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-5 w-20 bg-muted rounded"></div>
            <div className="h-10 w-full bg-muted rounded"></div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-5 w-20 bg-muted rounded"></div>
          <div className="h-10 w-full bg-muted rounded"></div>
        </div>

        <div className="space-y-2">
          <div className="h-5 w-20 bg-muted rounded"></div>
          <div className="h-10 w-full bg-muted rounded"></div>
        </div>

        <div className="space-y-4">
          <div className="flex space-x-3">
            <div className="h-5 w-5 bg-muted rounded"></div>
            <div className="h-5 w-3/4 bg-muted rounded"></div>
          </div>
          <div className="flex space-x-3">
            <div className="h-5 w-5 bg-muted rounded"></div>
            <div className="h-5 w-3/4 bg-muted rounded"></div>
          </div>
        </div>

        <div className="h-10 w-full bg-muted rounded"></div>
      </div>
    </div>
  )
}