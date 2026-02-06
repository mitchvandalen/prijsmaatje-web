import "./globals.css";

import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "PrijsMaatje",
  description: "Vind automatisch de goedkoopste supermarkt voor jouw boodschappen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className="pm-body">
        <AuthProvider>
          <div className="pm-shell">
            <Sidebar />
            <div className="pm-main">
              <TopBar />
              <main className="pm-content">
                <div className="pm-accent" />
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
