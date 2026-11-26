"use client";

import { useState } from "react";
import { CheckCircle2, MessageSquarePlus, Send } from "lucide-react";
import { FEEDBACK_ROLES } from "@/lib/bosp-constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

export function FeedbackForm() {
  const [senderName, setSenderName] = useState("");
  const [senderRole, setSenderRole] = useState<string>(FEEDBACK_ROLES[0]);
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/public/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName,
          senderRole,
          contact,
          message,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal mengirim pengaduan.");
      } else {
        setSuccessMsg(
          data.message ||
            "Aspirasi Anda berhasil dikirim dan akan ditinjau oleh pengelola sekolah."
        );
        setSenderName("");
        setContact("");
        setMessage("");
      }
    } catch {
      setError("Terjadi gangguan jaringan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="no-print border-[#E5DAC5]">
      <CardHeader className="border-b border-[#EFE6D5] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C9A24D]/40 bg-[#141923] text-[#E6C67A]">
            <MessageSquarePlus className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Kanal Pengaduan &amp; Umpan Balik Masyarakat</CardTitle>
            <CardDescription>
              Orang tua murid, komite sekolah, dan masyarakat dapat menyampaikan pertanyaan, saran, atau pengaduan terkait pengelolaan dana BOSP.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {successMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Pesan Terkirim</p>
              <p>{successMsg}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="senderName">Nama Lengkap</Label>
              <Input
                id="senderName"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Contoh: Ibu Made Sari"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senderRole">Peran / Status</Label>
              <Select
                id="senderRole"
                value={senderRole}
                onChange={(e) => setSenderRole(e.target.value)}
              >
                {FEEDBACK_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact">No. HP / WhatsApp / Email</Label>
              <Input
                id="contact"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="0812xxxx atau email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Pertanyaan, Saran, atau Pengaduan</Label>
            <Textarea
              id="message"
              required
              minLength={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tuliskan masukan atau pertanyaan Anda secara jelas dan santun..."
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-slate-500">
              Pesan akan tersimpan langsung ke kotak masuk Bendahara & Kepala Sekolah.
            </p>
            <Button type="submit" disabled={submitting} variant="default">
              <Send className="h-4 w-4" />
              {submitting ? "Mengirim..." : "Kirim Aspirasi / Pengaduan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
