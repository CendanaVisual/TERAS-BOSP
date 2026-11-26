import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <Skeleton className="h-96 w-full max-w-md rounded-xl" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
