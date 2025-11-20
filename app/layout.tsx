import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "Prospective scolaire NGSI-LD",
  description: "Interface de prospective scolaire connectée à un context broker NGSI-LD.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-ink text-white">
        <Providers>
          <header className="top-bar sticky top-0 z-30">
            <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent/80 to-accent/50 shadow-glow" />
              <div className="ml-3">
                <p className="text-sm text-muted">Prospective</p>
                <h1 className="text-lg font-semibold text-white">
                  Prospective scolaire NGSI-LD
                </h1>
              </div>
            </div>
          </header>
          <main className="main-surface">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
