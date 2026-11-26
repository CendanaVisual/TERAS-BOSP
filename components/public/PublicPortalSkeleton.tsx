import { Skeleton } from "@/components/ui/skeleton";

export function PublicPortalSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-52 bg-[#0F2A56]" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[420px] w-full rounded-xl" />
        <Skeleton className="h-[340px] w-full rounded-xl" />
      </main>
    </div>
  );
}
