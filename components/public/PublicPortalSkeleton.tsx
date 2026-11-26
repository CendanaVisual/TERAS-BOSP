import { Skeleton } from "@/components/ui/skeleton";

export function PublicPortalSkeleton() {
  return (
    <div className="min-h-screen bali-canvas-bg">
      <div className="h-56 bali-obsidian-hero" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[420px] w-full rounded-2xl" />
        <Skeleton className="h-[340px] w-full rounded-2xl" />
      </main>
    </div>
  );
}
