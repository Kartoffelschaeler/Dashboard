import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Dashboard",
  description: "Ein ruhiges persönliches Dashboard mit Zentrale und Kalender.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
