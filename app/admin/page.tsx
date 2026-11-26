import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  serializeBudgetPeriod,
  type SerializedSchoolProfile,
} from "@/lib/bosp-queries";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { Skeleton } from "@/components/ui/skeleton";

async function AdminDashboardContent() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [profileRecord, periodRecords, feedbackRecords] = await Promise.all([
    prisma.schoolProfile.findFirst(),
    prisma.budgetPeriod.findMany({
      orderBy: [{ fiscalYear: "desc" }, { updatedAt: "desc" }],
      include: {
        expenses: {
          orderBy: [{ componentCategory: "asc" }, { accountCode: "asc" }],
        },
      },
    }),
    prisma.publicFeedback.findMany({
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const initialProfile: SerializedSchoolProfile = profileRecord
    ? {
        id: profileRecord.id,
        name: profileRecord.name,
        npsn: profileRecord.npsn,
        address: profileRecord.address,
        headmaster: profileRecord.headmaster,
        treasurer: profileRecord.treasurer,
        phone: profileRecord.phone,
        email: profileRecord.email,
        district: profileRecord.district,
        province: profileRecord.province,
        updatedAt: profileRecord.updatedAt.toISOString(),
      }
    : {
        id: "new",
        name: "Nama Sekolah",
        npsn: "00000000",
        address: "",
        headmaster: "",
        treasurer: "",
        phone: "",
        email: "",
        district: "",
        province: "",
        updatedAt: new Date().toISOString(),
      };

  const initialPeriods = periodRecords.map(serializeBudgetPeriod);
  const initialFeedbacks = feedbackRecords.map((f) => ({
    id: f.id,
    senderName: f.senderName,
    senderRole: f.senderRole,
    contact: f.contact,
    message: f.message,
    isRead: f.isRead,
    adminNote: f.adminNote,
    createdAt: f.createdAt.toISOString(),
  }));

  return (
    <AdminDashboardClient
      session={session}
      initialProfile={initialProfile}
      initialPeriods={initialPeriods}
      initialFeedbacks={initialFeedbacks}
    />
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50">
          <div className="h-28 bg-[#0F2A56]" />
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
