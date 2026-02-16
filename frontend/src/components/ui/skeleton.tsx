import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="glass rounded-xl p-6">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}
