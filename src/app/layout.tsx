import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduPros - Multi-Tenant Educational Management System",
  description:
    "Next-generation unified educational management platform connecting Platform Super Admins, Institution Admins, Teachers, and Students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-brand-bg text-brand-text font-sans antialiased selection:bg-brand-blue selection:text-white">
        {children}
      </body>
    </html>
  );
}
