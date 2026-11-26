"use client";

import { useState } from "react";
import { Check, Inbox, MailOpen, Trash2 } from "lucide-react";
import { formatDateId } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface FeedbackItem {
  id: string;
  senderName: string;
  senderRole: string;
  contact: string;
  message: string;
  isRead: boolean;
  adminNote: string | null;
  createdAt: string;
}

interface FeedbackInboxProps {
  feedbacks: FeedbackItem[];
  onRefresh: () => void;
}

export function FeedbackInbox({ feedbacks, onRefresh }: FeedbackInboxProps) {
  const [filterUnread, setFilterUnread] = useState(false);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = filterUnread
    ? feedbacks.filter((f) => !f.isRead)
    : feedbacks;

  const updateFeedback = async (
    id: string,
    payload: { isRead?: boolean; adminNote?: string }
  ) => {
    setBusyId(id);
    try {
      await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!window.confirm("Hapus pesan pengaduan ini?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/feedback?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-[#0F2A56]" />
              Kotak Masuk Pengaduan & Aspirasi Publik
            </CardTitle>
            <CardDescription>
              Pesan yang dikirim orang tua murid, komite sekolah, atau masyarakat melalui Portal Umum.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant={filterUnread ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterUnread(!filterUnread)}
          >
            {filterUnread ? "Tampilkan Semua" : "Hanya Belum Dibaca"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Tidak ada pesan pengaduan pada tampilan ini.
          </p>
        ) : (
          visible.map((item) => {
            const noteVal =
              notesDraft[item.id] !== undefined
                ? notesDraft[item.id]
                : item.adminNote || "";
            const isBusy = busyId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 space-y-3 ${
                  item.isRead
                    ? "border-slate-200 bg-white"
                    : "border-blue-200 bg-blue-50/40"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#0F2A56]">
                        {item.senderName}
                      </span>
                      <Badge variant="navy">{item.senderRole}</Badge>
                      {!item.isRead && <Badge variant="amber">Baru</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">
                      Kontak: <strong>{item.contact}</strong> •{" "}
                      {formatDateId(item.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() =>
                        void updateFeedback(item.id, { isRead: !item.isRead })
                      }
                    >
                      <MailOpen className="h-3.5 w-3.5" />
                      {item.isRead ? "Tandai Belum Dibaca" : "Tandai Dibaca"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => void deleteFeedback(item.id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-sm text-slate-800 whitespace-pre-line">
                  {item.message}
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    className="h-9 text-xs"
                    placeholder="Catat tindak lanjut internal admin/bendahara..."
                    value={noteVal}
                    onChange={(e) =>
                      setNotesDraft({ ...notesDraft, [item.id]: e.target.value })
                    }
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isBusy}
                    onClick={() =>
                      void updateFeedback(item.id, {
                        isRead: true,
                        adminNote: noteVal,
                      })
                    }
                  >
                    <Check className="h-3.5 w-3.5" />
                    Simpan Catatan
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
