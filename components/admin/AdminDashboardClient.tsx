"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ExternalLink,
  FileCheck2,
  Inbox,
  LogOut,
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
    <div className="min-h-screen flex flex-col">
      {/* Top Admin Header — Obsidian & Balinese Gold */}
      <header className="relative overflow-hidden border-b border-[#C9A24D]/30 bali-obsidian-hero text-white">
        <div className="pointer-events-none absolute inset-0 bali-patra-overlay opacity-70" />
        <div className="relative mx-auto flex max-w-7xl flex-col sm:flex-row sm:items-center justify-between gap-3 px-3.5 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-full p-0.5 bg-gradient-to-b from-[#DFBC6F]/70 to-[#8A6820]/30 shadow-[0_0_16px_rgba(212,175,55,0.3)]">
              <div className="relative h-full w-full rounded-full overflow-hidden bg-[#10141C]">
                <Image
                  src="/logo.gif"
                  alt="Logo TERAS-BOSP"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h1 className="font-display text-sm sm:text-lg font-bold tracking-wide text-[#F4E6C3] truncate">
                  Dashboard Admin TERAS-BOSP
                </h1>
                <Badge className="bg-[#0D6E52]/35 text-emerald-200 border-emerald-400/40 text-[10px] sm:text-xs">
                  {publishedCount} Tayang
                </Badge>
              </div>
              <p className="text-[11px] sm:text-xs text-[#C7BFA9] truncate">
                {profile.name} • <strong className="text-[#FAF5EA]">{session.email}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <Link href="/" target="_blank" className="w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto border-[#C9A24D]/40 bg-white/10 text-[#F4E6C3] hover:bg-white/20 hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Portal Publik
              </Button>
            </Link>
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={handleLogout}
              className="w-full sm:w-auto"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="relative mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto no-scrollbar pb-0 pt-1">
            {navItems.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-t-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-[#F6F1E7] text-[#141923] shadow-xs"
                      : "text-[#D7CEBE] hover:bg-white/10 hover:text-[#FAF5EA]"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        tab.id === "feedback" && unreadCount > 0
                          ? "bg-[#DFBC6F] text-[#11141B]"
                          : active
                          ? "bg-[#141923]/10 text-[#141923]"
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
