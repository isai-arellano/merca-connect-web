import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md",
        "bg-muted/55 dark:bg-muted/40",
        "bg-gradient-to-r from-muted/90 via-muted-foreground/[0.12] to-muted/90 bg-[length:200%_100%] animate-shimmer",
        "motion-reduce:animate-none motion-reduce:bg-muted/60",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
