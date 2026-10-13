import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DriverProvider } from "@/lib/store";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Saafera Captain — Driver",
  description: "Drive. Earn. Own it. The driver app for Saafera cabs.",
  icons: { icon: "/saafera-logo.jpg", apple: "/saafera-logo.jpg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0f1e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={sans.variable}>
      <body className="font-sans antialiased">
        <DriverProvider>{children}</DriverProvider>
      </body>
    </html>
  );
}
