import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Advanced File Manager",
  description: "Professional file manager with code editor and desktop features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
