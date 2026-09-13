import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import RefreshRedirector from "./RefreshRedirector";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareDoc AI - Medical Document Simplifier",
  description: "Understand your discharge summaries and prescriptions instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased text-foreground min-h-screen relative`}>
        <AuthProvider>
          <RefreshRedirector />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
