import { cn } from "@/lib/utils"

type SkeletonProps = React.ComponentProps<"div"> & {
  variant?: "skeleton" | "muted"
}

function Skeleton({ className, variant = "skeleton", ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md",
        variant === "muted" ? "bg-muted" : "bg-skeleton",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
