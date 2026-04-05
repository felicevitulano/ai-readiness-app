import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Readiness Assessment — Think Next",
  description: "Strumento di valutazione della maturità digitale e AI readiness",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background">
        <header className="bg-tn-blue text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo-white.png" alt="Think Next" width={180} height={45} priority />
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="hover:text-tn-orange transition-colors">
                Dashboard
              </Link>
              <Link href="/admin" className="hover:text-tn-orange transition-colors">
                Admin
              </Link>
              <Link
                href="/assessment/new"
                className="bg-tn-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                + Nuovo Assessment
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
          {children}
        </main>
        <footer className="bg-tn-blue text-white/60 text-center text-xs py-3">
          Think Next S.r.l. — innovation for business
        </footer>
      </body>
    </html>
  );
}
