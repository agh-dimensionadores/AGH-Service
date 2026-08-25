import type { Metadata } from "next";
import { NavigationProgress } from "@/components/navigation-progress";
import "./globals.css";

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
    <html lang="es">
      <body>
        <NavigationProgress />
        {children}
      </body>
    </html>
  );
}
