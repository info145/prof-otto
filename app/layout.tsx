import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentor - Prof Otto",
  description: "Mentor didattico AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <div className="min-h-screen text-[#111111]">
          <main className="mx-auto flex h-screen max-w-[1440px] min-h-0 px-4 py-4 md:px-6 md:py-6">
            <div className="apple-card flex w-full min-h-0 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
