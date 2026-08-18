import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { NavigationProgress } from "@/components/navigation-progress";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-next",
  weight: ["500", "600", "700"],
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body-next",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AGH Dimensionadores — Servicio técnico",
  description:
    "Panel de mantenimiento de equipos de dimensionado 3D y pesaje para logística",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body
        style={
          {
            ["--font-display" as string]: "var(--font-display-next), sans-serif",
            ["--font-body" as string]: "var(--font-body-next), sans-serif",
          } as React.CSSProperties
        }
      >
        <NavigationProgress />
        {children}
      </body>
    </html>
  );
}
