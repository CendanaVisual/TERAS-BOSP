"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Email atau password tidak valid.");
        setLoading(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Gagal menghubungi server autentikasi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bali-obsidian-hero px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bali-patra-overlay opacity-75" />

      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto relative h-24 w-24 rounded-full p-1 bg-gradient-to-b from-[#DFBC6F]/70 to-[#8A6820]/30 shadow-[0_0_32px_rgba(212,175,55,0.35)]">
            <div className="relative h-full w-full rounded-full overflow-hidden bg-[#10141C]">
              <Image
                src="/logo.gif"
                alt="Logo TERAS-BOSP"
                fill
                unoptimized
                priority
                className="object-cover"
              />
            </div>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wider text-[#F4E6C3]">
            Portal Admin TERAS-BOSP
          </h1>
          <p className="text-sm text-[#C7BFA9]">
            Dashboard Operator &amp; Bendahara Pengelola Transparansi Dana BOSP
          </p>
        </div>

        <Card className="border-[#C9A24D]/40 bg-[#FFFDF9] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#9E7828] via-[#DFBC6F] to-[#9E7828]" />
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-[#B8862D]" />
              Masuk ke Dashboard Admin
            </CardTitle>
            <CardDescription>
              Gunakan akun Bendahara atau Operator Sekolah yang terdaftar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Operator / Bendahara</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sdn7pedungan63@gmail.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="gold"
                className="w-full font-bold"
                size="lg"
              >
                <LogIn className="h-4 w-4" />
                {loading ? "Memverifikasi..." : "Masuk ke Portal Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#E5D7BC] hover:text-[#DFBC6F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Portal Publik Masyarakat
          </Link>
        </div>
      </div>
    </div>
  );
}
