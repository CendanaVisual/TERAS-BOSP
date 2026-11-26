"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, LogIn } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Login gagal (status ${res.status}).`);
        setErrorCode(data.code || null);
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
    <div className="min-h-screen relative flex flex-col items-center justify-center bali-obsidian-hero px-4 py-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bali-patra-overlay opacity-75" />

      <div className="relative w-full max-w-md space-y-5">
        <div className="text-center space-y-2.5">
          <div className="mx-auto relative h-20 w-20 sm:h-24 sm:w-24 rounded-full p-1 bg-gradient-to-b from-[#DFBC6F]/70 to-[#8A6820]/30 shadow-[0_0_28px_rgba(212,175,55,0.35)]">
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
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#DFBC6F]">
              Portal Admin
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wider text-[#F4E6C3] whitespace-nowrap">
              TERAS-BOSP
            </h1>
            <p className="text-xs sm:text-sm text-[#C7BFA9] px-2">
              Dashboard Operator &amp; Bendahara Transparansi Dana BOSP
            </p>
          </div>
        </div>

        <Card className="border-[#C9A24D]/40 bg-[#FFFDF9] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#9E7828] via-[#DFBC6F] to-[#9E7828]" />
          <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-[#B8862D] shrink-0" />
              Masuk ke Dashboard Admin
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Gunakan akun Bendahara atau Operator Sekolah yang terdaftar.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs sm:text-sm text-red-700 space-y-1.5">
                <p>{error}</p>
                {errorCode === "MISSING_DATABASE_URL" && (
                  <a
                    href="/api/health"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block font-semibold underline text-red-800"
                  >
                    Cek status environment di /api/health →
                  </a>
                )}
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
                  className="h-11 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="h-11 pr-11 text-base sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Sembunyikan password" : "Tampilkan password"
                    }
                    title={
                      showPassword ? "Sembunyikan password" : "Tampilkan password"
                    }
                    className="absolute right-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg text-[#6B6253] hover:bg-[#F3ECE0] hover:text-[#141923] focus:outline-none focus:ring-2 focus:ring-[#C9A24D]/40 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                variant="gold"
                className="w-full h-11 font-bold"
                size="lg"
              >
                <LogIn className="h-4 w-4" />
                {loading ? "Memverifikasi..." : "Masuk ke Portal Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#E5D7BC] hover:text-[#DFBC6F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Portal Publik Masyarakat
          </Link>
        </div>
      </div>
    </div>
  );
}
