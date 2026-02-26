import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentor - Prof Otto",
  description: "Mentor didattico AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="h-dvh overflow-hidden">
        <div className="h-full min-h-0 text-[#111111]">
          <main className="mx-auto flex h-full min-h-0 max-w-[1440px] px-4 py-4 md:px-6 md:py-6">
            <div className="apple-card flex h-full w-full min-h-0 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
