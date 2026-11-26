"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ExternalLink,
  FileCheck2,
  Inbox,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { AdminSessionPayload } from "@/lib/auth-token";
import type {
  SerializedBudgetPeriod,
  SerializedSchoolProfile,
} from "@/lib/bosp-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeedbackInbox, type FeedbackItem } from "./FeedbackInbox";
import { PublicationsManager } from "./PublicationsManager";
import { SchoolProfileForm } from "./SchoolProfileForm";
import { SmartUploadExtractor } from "./SmartUploadExtractor";

interface AdminDashboardClientProps {
  session: AdminSessionPayload;
  initialProfile: SerializedSchoolProfile;
  initialPeriods: SerializedBudgetPeriod[];
  initialFeedbacks: FeedbackItem[];
}

type AdminTab = "upload" | "publications" | "feedback" | "profile";

export function AdminDashboardClient({
  session,
  initialProfile,
  initialPeriods,
  initialFeedbacks,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("upload");
  const [profile, setProfile] = useState(initialProfile);
  const [periods, setPeriods] = useState(initialPeriods);
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);

  const unreadCount = feedbacks.filter((f) => !f.isRead).length;
  const publishedCount = periods.filter((p) => p.status === "PUBLISHED").length;

  const refreshPeriods = useCallback(async () => {
    const res = await fetch("/api/admin/periods");
    if (res.ok) {
      const data = await res.json();
      setPeriods(data.periods || []);
    }
  }, []);

  const refreshFeedbacks = useCallback(async () => {
    const res = await fetch("/api/admin/feedback");
    if (res.ok) {
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
    }
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const navItems: Array<{
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      id: "upload",
      label: "AI Smart Upload",
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      id: "publications",
      label: "Manajemen Publikasi",
      icon: <FileCheck2 className="h-4 w-4" />,
      badge: periods.length,
    },
    {
      id: "feedback",
      label: "Pengaduan Publik",
      icon: <Inbox className="h-4 w-4" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: "profile",
      label: "Profil Sekolah",
      icon: <Building2 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Admin Header */}
      <header className="border-b border-slate-200 bg-[#0F2A56] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 border border-white/20">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight">
                  Dashboard Admin TERAS-BOSP
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30">
                  {publishedCount} Laporan Tayang
                </Badge>
              </div>
              <p className="text-xs text-blue-200">
                {profile.name} (NPSN: {profile.npsn}) • Masuk sebagai{" "}
                <strong className="text-white">{session.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" target="_blank">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Portal Publik
              </Button>
            </Link>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto pb-0 pt-1">
            {navItems.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-slate-50 text-[#0F2A56]"
                      : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        tab.id === "feedback" && unreadCount > 0
                          ? "bg-amber-400 text-slate-900"
                          : active
                          ? "bg-[#0F2A56]/10 text-[#0F2A56]"
                          : "bg-white/15 text-white"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Tab Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === "upload" && (
          <SmartUploadExtractor
            onSaved={() => {
              void refreshPeriods();
            }}
          />
        )}

        {activeTab === "publications" && (
          <PublicationsManager
            periods={periods}
            onRefresh={() => {
              void refreshPeriods();
            }}
          />
        )}

        {activeTab === "feedback" && (
          <FeedbackInbox
            feedbacks={feedbacks}
            onRefresh={() => {
              void refreshFeedbacks();
            }}
          />
        )}

        {activeTab === "profile" && (
          <SchoolProfileForm
            initialProfile={profile}
            onUpdated={(updated) => setProfile(updated)}
          />
        )}
      </main>
    </div>
  );
}
