"use client";

import { useState } from "react";
import { Building2, CheckCircle2, Save } from "lucide-react";
import type { SerializedSchoolProfile } from "@/lib/bosp-queries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";

interface SchoolProfileFormProps {
  initialProfile: SerializedSchoolProfile;
  onUpdated: (profile: SerializedSchoolProfile) => void;
}

export function SchoolProfileForm({
  initialProfile,
  onUpdated,
}: SchoolProfileFormProps) {
  const [form, setForm] = useState({
    name: initialProfile.name,
    npsn: initialProfile.npsn,
    address: initialProfile.address,
    headmaster: initialProfile.headmaster,
    treasurer: initialProfile.treasurer,
    phone: initialProfile.phone,
    email: initialProfile.email,
    district: initialProfile.district,
    province: initialProfile.province,
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal menyimpan profil sekolah.");
      } else {
        setSavedMsg("Profil identitas sekolah berhasil diperbarui dan tampil di Portal Umum.");
        onUpdated({
          ...initialProfile,
          ...data.profile,
          updatedAt: data.profile.updatedAt || new Date().toISOString(),
        });
      }
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-slate-100 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#0F2A56]" />
          Pengaturan Identitas & Profil Sekolah
        </CardTitle>
        <CardDescription>
          Informasi ini ditampilkan pada header Portal Transparansi Umum dan dokumen PDF resmi.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        {savedMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{savedMsg}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nama Sekolah</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>NPSN</Label>
              <Input
                required
                value={form.npsn}
                onChange={(e) => setForm({ ...form, npsn: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Kepala Sekolah</Label>
              <Input
                required
                value={form.headmaster}
                onChange={(e) =>
                  setForm({ ...form, headmaster: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Bendahara BOSP</Label>
              <Input
                required
                value={form.treasurer}
                onChange={(e) =>
                  setForm({ ...form, treasurer: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Nomor Telepon / Kontak Sekolah</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Email Resmi Sekolah</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Kecamatan / Kabupaten / Kota</Label>
              <Input
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Provinsi</Label>
              <Input
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Alamat Lengkap Sekolah</Label>
            <Textarea
              required
              className="min-h-[80px]"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Profil Sekolah"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
