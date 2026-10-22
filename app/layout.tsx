import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout"; // ตรวจสอบ Path ให้ตรงกับที่คุณสร้าง

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RoomsChat Dashboard",
  description: "Hotel messaging dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
