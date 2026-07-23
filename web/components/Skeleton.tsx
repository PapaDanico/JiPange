/**
 * Shared shimmer placeholder for content that resolves after hydration.
 * Compose with height/width utilities: <Skeleton className="h-24" />.
 */
export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl bg-canvas ${className}`}
    />
  );
}
