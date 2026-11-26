import type { Metadata } from "next";
import { Cinzel, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TERAS-BOSP | Transparansi Elektronik Realisasi Anggaran Sekolah",
  description:
    "Portal resmi keterbukaan dan akuntabilitas pengelolaan Dana Bantuan Operasional Satuan Pendidikan (BOSP) sekolah yang elegan, transparan, dan mudah diakses masyarakat.",
  icons: {
    icon: [{ url: "/favicon.gif", type: "image/gif" }],
    shortcut: [{ url: "/favicon.gif", type: "image/gif" }],
    apple: [{ url: "/logo.gif", type: "image/gif" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${cinzel.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bali-canvas-bg text-[#1B1F2A] font-sans selection:bg-[#C9A24D]/25 selection:text-[#11151E]">
        {children}
      </body>
    </html>
  );
}
